/**
 * Intelli-Notes File Upload API
 * 
 * Handles audio/video file uploads for meeting recordings.
 * Uploads to Supabase Storage and initiates transcription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createMeetingService } from '~/lib/meetings';

// =============================================================================
// Configuration
// =============================================================================

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

// =============================================================================
// POST - Upload Recording File
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const client = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the meeting to verify ownership
    const meetingService = createMeetingService(client);
    const meeting = await meetingService.getMeeting(meetingId);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const startTranscription = formData.get('transcribe') === 'true';
    const speakerCount = formData.get('speaker_count');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Allowed: MP3, WAV, WEBM, OGG, M4A, MP4, MOV',
          allowedTypes: ALLOWED_MIME_TYPES,
        },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop() || 'mp3';
    const fileName = `${meetingId}/${Date.now()}.${fileExt}`;
    const storagePath = `recordings/${fileName}`;

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await client.storage
      .from('meeting-recordings')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = client.storage
      .from('meeting-recordings')
      .getPublicUrl(storagePath);

    const recordingUrl = urlData.publicUrl;

    // Update meeting with recording info
    await client.from('meetings').update({
      recording_url: recordingUrl,
      recording_size_bytes: file.size,
      updated_at: new Date().toISOString(),
    }).eq('id', meetingId);

    // Start transcription if requested
    let transcriptionStatus = null;
    if (startTranscription) {
      try {
        const transcript = await meetingService.processRecording(
          meetingId,
          recordingUrl,
          { speaker_count: speakerCount ? parseInt(speakerCount as string) : undefined }
        );
        transcriptionStatus = 'completed';
      } catch (transcriptionError) {
        console.error('Transcription error:', transcriptionError);
        transcriptionStatus = 'failed';
      }
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      recording_url: recordingUrl,
      file_size: file.size,
      file_type: file.type,
      storage_path: storagePath,
      transcription_status: transcriptionStatus,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Remove Recording File
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const client = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the meeting
    const { data: meeting, error: meetingError } = await client
      .from('meetings')
      .select('recording_url')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (!meeting.recording_url) {
      return NextResponse.json({ error: 'No recording to delete' }, { status: 400 });
    }

    // Extract storage path from URL
    const url = new URL(meeting.recording_url);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/meeting-recordings\/(.+)/);
    
    if (pathMatch) {
      const storagePath = pathMatch[1];
      
      // Delete from storage
      const { error: deleteError } = await client.storage
        .from('meeting-recordings')
        .remove([storagePath]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
      }
    }

    // Update meeting to remove recording reference
    await client.from('meetings').update({
      recording_url: null,
      recording_size_bytes: null,
      updated_at: new Date().toISOString(),
    }).eq('id', meetingId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting recording:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
