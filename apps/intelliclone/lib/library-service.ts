import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type LibraryCategory = 'about_me' | 'business' | 'reference' | 'general';

export interface LibraryItem {
  id: string;
  user_id: string;
  name: string;
  category: LibraryCategory;
  file_type: string | null;
  file_url: string | null;
  file_size: number | null;
  content_text: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all library items for a user
 */
export async function getUserLibrary(userId: string): Promise<LibraryItem[]> {
  const { data, error } = await supabaseAdmin
    .from('user_library')
    .select('*')
    .eq('user_id', userId)
    .order('category')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching library:', error);
    return [];
  }

  return data || [];
}

/**
 * Get library items by category
 */
export async function getLibraryByCategory(
  userId: string, 
  category: LibraryCategory
): Promise<LibraryItem[]> {
  const { data, error } = await supabaseAdmin
    .from('user_library')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching library by category:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a library item
 */
export async function addLibraryItem(
  userId: string,
  name: string,
  category: LibraryCategory = 'general',
  options?: {
    fileType?: string;
    fileUrl?: string;
    fileSize?: number;
    contentText?: string;
    summary?: string;
  }
): Promise<LibraryItem | null> {
  const { data, error } = await supabaseAdmin
    .from('user_library')
    .insert({
      user_id: userId,
      name,
      category,
      file_type: options?.fileType,
      file_url: options?.fileUrl,
      file_size: options?.fileSize,
      content_text: options?.contentText,
      summary: options?.summary,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding library item:', error);
    return null;
  }

  return data;
}

/**
 * Update a library item
 */
export async function updateLibraryItem(
  itemId: string,
  userId: string,
  updates: Partial<Pick<LibraryItem, 'name' | 'category' | 'content_text' | 'summary'>>
): Promise<LibraryItem | null> {
  const { data, error } = await supabaseAdmin
    .from('user_library')
    .update(updates)
    .eq('id', itemId)
    .eq('user_id', userId) // Security: ensure ownership
    .select()
    .single();

  if (error) {
    console.error('Error updating library item:', error);
    return null;
  }

  return data;
}

/**
 * Delete a library item
 */
export async function deleteLibraryItem(itemId: string, userId: string): Promise<boolean> {
  // First get the item to find the file URL
  const { data: item } = await supabaseAdmin
    .from('user_library')
    .select('file_url')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  // Delete the file from storage if it exists
  if (item?.file_url) {
    const filePath = item.file_url.split('/library/')[1];
    if (filePath) {
      await supabaseAdmin.storage.from('library').remove([filePath]);
    }
  }

  // Delete the database record
  const { error } = await supabaseAdmin
    .from('user_library')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting library item:', error);
    return false;
  }

  return true;
}

/**
 * Format library items for injection into system prompt
 */
export function formatLibraryForPrompt(items: LibraryItem[]): string {
  if (items.length === 0) {
    return '';
  }

  const grouped: Record<string, LibraryItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }

  const categoryLabels: Record<string, string> = {
    about_me: 'About the User',
    business: 'Their Business/Work',
    reference: 'Reference Documents',
    general: 'Other Context',
  };

  const sections: string[] = [];

  for (const [category, categoryItems] of Object.entries(grouped)) {
    const label = categoryLabels[category] || category;
    const content = categoryItems
      .filter(item => item.content_text || item.summary)
      .map(item => {
        const text = item.summary || item.content_text?.slice(0, 1000);
        return `**${item.name}:**\n${text}`;
      })
      .join('\n\n');

    if (content) {
      sections.push(`## ${label}\n${content}`);
    }
  }

  return sections.length > 0 
    ? `\n\n## User's Library Context:\n${sections.join('\n\n')}`
    : '';
}

/**
 * Extract text from uploaded file (basic implementation)
 */
export async function extractTextFromFile(
  fileBuffer: ArrayBuffer,
  fileType: string,
  fileName: string
): Promise<string> {
  // For now, only handle text files directly
  // PDF and DOCX would need additional libraries
  
  if (fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(fileBuffer);
  }

  // For other types, return empty (could integrate PDF parser later)
  return '';
}

/**
 * Generate summary of content using AI
 */
export async function generateSummary(content: string, fileName: string): Promise<string> {
  if (!content || content.length < 100) {
    return content;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Summarize the following document in 2-3 sentences. Focus on key facts that would help personalize AI responses.',
          },
          {
            role: 'user',
            content: `File: ${fileName}\n\nContent:\n${content.slice(0, 4000)}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return content.slice(0, 500);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || content.slice(0, 500);
  } catch (error) {
    console.error('Error generating summary:', error);
    return content.slice(0, 500);
  }
}

/**
 * Upload file to storage
 */
export async function uploadLibraryFile(
  userId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from('library')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('library')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
}
