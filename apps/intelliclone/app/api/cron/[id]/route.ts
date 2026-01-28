import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const CRON_STORE_PATH = path.join(homedir(), '.clawdbot', 'cron', 'jobs.json');

interface CronStore {
  jobs: Array<{
    id: string;
    [key: string]: unknown;
  }>;
}

function readCronStore(): CronStore {
  if (!existsSync(CRON_STORE_PATH)) {
    return { jobs: [] };
  }
  const data = readFileSync(CRON_STORE_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeCronStore(store: CronStore): void {
  writeFileSync(CRON_STORE_PATH, JSON.stringify(store, null, 2));
}

// GET - Get a single cron job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = readCronStore();
    const job = store.jobs.find((j) => j.id === id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error reading cron job:', error);
    return NextResponse.json({ error: 'Failed to read cron job' }, { status: 500 });
  }
}

// PATCH - Update a cron job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const store = readCronStore();
    const jobIndex = store.jobs.findIndex((j) => j.id === id);

    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Merge updates
    store.jobs[jobIndex] = {
      ...store.jobs[jobIndex],
      ...body,
      id, // Ensure ID doesn't change
      updatedAtMs: Date.now(),
    };

    writeCronStore(store);

    return NextResponse.json({ job: store.jobs[jobIndex] });
  } catch (error) {
    console.error('Error updating cron job:', error);
    return NextResponse.json({ error: 'Failed to update cron job' }, { status: 500 });
  }
}

// DELETE - Remove a cron job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = readCronStore();
    const jobIndex = store.jobs.findIndex((j) => j.id === id);

    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    store.jobs.splice(jobIndex, 1);
    writeCronStore(store);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting cron job:', error);
    return NextResponse.json({ error: 'Failed to delete cron job' }, { status: 500 });
  }
}
