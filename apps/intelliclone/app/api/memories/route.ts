import { NextRequest, NextResponse } from 'next/server';
import {
  getUserMemories,
  saveMemory,
  deleteMemory,
  MemoryCategory,
} from '~/lib/memory-service';

/**
 * GET /api/memories?userId=xxx
 * Get all memories for a user
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

    const memories = await getUserMemories(userId);
    
    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memories
 * Create or update a memory
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, key, value, category = 'other' } = await request.json();
    
    if (!userId || !key || !value) {
      return NextResponse.json(
        { error: 'userId, key, and value are required' },
        { status: 400 }
      );
    }

    const memory = await saveMemory(
      userId,
      key,
      value,
      category as MemoryCategory,
      1.0,
      'manual'
    );

    if (!memory) {
      return NextResponse.json(
        { error: 'Failed to save memory' },
        { status: 500 }
      );
    }

    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Error saving memory:', error);
    return NextResponse.json(
      { error: 'Failed to save memory' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memories
 * Delete a memory
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId, key } = await request.json();
    
    if (!userId || !key) {
      return NextResponse.json(
        { error: 'userId and key are required' },
        { status: 400 }
      );
    }

    const success = await deleteMemory(userId, key);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete memory' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    );
  }
}
