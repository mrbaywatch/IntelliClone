import { NextRequest, NextResponse } from 'next/server';
import {
  getUserLibrary,
  addLibraryItem,
  updateLibraryItem,
  deleteLibraryItem,
  extractTextFromFile,
  generateSummary,
  LibraryCategory,
} from '~/lib/library-service';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/library?userId=xxx
 * Get all library items for a user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const items = await getUserLibrary(userId);
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching library:', error);
    return NextResponse.json(
      { error: 'Failed to fetch library' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/library
 * Add a new library item (with optional file upload)
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const userId = formData.get('userId') as string;
      const name = formData.get('name') as string;
      const category = (formData.get('category') as LibraryCategory) || 'general';
      const file = formData.get('file') as File | null;

      if (!userId || !name) {
        return NextResponse.json(
          { error: 'userId and name are required' },
          { status: 400 }
        );
      }

      let fileUrl: string | undefined;
      let fileType: string | undefined;
      let fileSize: number | undefined;
      let contentText: string | undefined;
      let summary: string | undefined;

      if (file) {
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const fileBuffer = await file.arrayBuffer();
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from('library')
          .upload(filePath, fileBuffer, {
            contentType: file.type,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
          );
        }

        const { data: urlData } = supabaseAdmin.storage
          .from('library')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileType = file.type;
        fileSize = file.size;

        // Extract text content
        contentText = await extractTextFromFile(fileBuffer, file.type, file.name);
        
        // Generate summary if we have content
        if (contentText && contentText.length > 50) {
          summary = await generateSummary(contentText, file.name);
        }
      }

      const item = await addLibraryItem(userId, name, category, {
        fileType,
        fileUrl,
        fileSize,
        contentText,
        summary,
      });

      if (!item) {
        return NextResponse.json(
          { error: 'Failed to add library item' },
          { status: 500 }
        );
      }

      return NextResponse.json({ item });
    }
    
    // Handle JSON body (text content without file)
    const { userId, name, category = 'general', contentText } = await request.json();
    
    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      );
    }

    let summary: string | undefined;
    if (contentText && contentText.length > 50) {
      summary = await generateSummary(contentText, name);
    }

    const item = await addLibraryItem(userId, name, category as LibraryCategory, {
      contentText,
      summary,
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Failed to add library item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error adding library item:', error);
    return NextResponse.json(
      { error: 'Failed to add library item' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/library
 * Update a library item
 */
export async function PATCH(request: NextRequest) {
  try {
    const { itemId, userId, name, category, contentText } = await request.json();
    
    if (!itemId || !userId) {
      return NextResponse.json(
        { error: 'itemId and userId are required' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (category) updates.category = category;
    if (contentText !== undefined) {
      updates.content_text = contentText;
      if (contentText && contentText.length > 50) {
        updates.summary = await generateSummary(contentText, name || 'Document');
      }
    }

    const item = await updateLibraryItem(itemId, userId, updates);

    if (!item) {
      return NextResponse.json(
        { error: 'Failed to update library item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating library item:', error);
    return NextResponse.json(
      { error: 'Failed to update library item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/library
 * Delete a library item
 */
export async function DELETE(request: NextRequest) {
  try {
    const { itemId, userId } = await request.json();
    
    if (!itemId || !userId) {
      return NextResponse.json(
        { error: 'itemId and userId are required' },
        { status: 400 }
      );
    }

    const success = await deleteLibraryItem(itemId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete library item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting library item:', error);
    return NextResponse.json(
      { error: 'Failed to delete library item' },
      { status: 500 }
    );
  }
}
