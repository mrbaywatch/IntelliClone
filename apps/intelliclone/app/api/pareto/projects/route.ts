import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch user's projects
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('pareto_projects')
      .select(`
        *,
        pareto_documents (id, name, file_type, file_size),
        pareto_messages (id, role, content, files, created_at)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    const { data: project, error } = await supabase
      .from('pareto_projects')
      .insert({ user_id: userId, name })
      .select()
      .single();

    if (error) throw error;

    // Add welcome message
    await supabase.from('pareto_messages').insert({
      project_id: project.id,
      user_id: userId,
      role: 'assistant',
      content: `Hei! 👋 Jeg er klar til å hjelpe deg med **${name}**.

Last opp dokumentene du vil at jeg skal sjekke:
- Forsikringsbevis / fornyelsesforslag
- E-postkorrespondanse med avtaleendringer  
- Fjorårets avtale (for sammenligning)

Jeg går gjennom alt steg for steg sammen med deg! 📊`
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pareto_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
