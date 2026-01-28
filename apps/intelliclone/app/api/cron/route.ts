import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const CRON_STORE_PATH = path.join(homedir(), '.clawdbot', 'cron', 'jobs.json');

interface CronJob {
  id: string;
  agentId?: string;
  name: string;
  enabled: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  schedule: {
    kind: 'at' | 'every' | 'cron';
    expr?: string;
    ms?: number;
    at?: number;
    tz?: string;
  };
  sessionTarget: 'main' | 'isolated';
  wakeMode?: 'now' | 'next-heartbeat';
  payload: {
    kind: 'systemEvent' | 'agentTurn';
    text?: string;
    message?: string;
    deliver?: boolean;
    channel?: string;
    to?: string;
  };
  deleteAfterRun?: boolean;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    lastError?: string;
  };
}

interface CronStore {
  jobs: CronJob[];
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

// GET - List all cron jobs
export async function GET() {
  try {
    const store = readCronStore();
    return NextResponse.json({ jobs: store.jobs });
  } catch (error) {
    console.error('Error reading cron store:', error);
    return NextResponse.json({ error: 'Failed to read cron jobs' }, { status: 500 });
  }
}

// POST - Add a new cron job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = readCronStore();

    const newJob: CronJob = {
      id: crypto.randomUUID(),
      agentId: body.agentId || 'main',
      name: body.name || 'Unnamed Job',
      enabled: body.enabled !== false,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      schedule: body.schedule || { kind: 'cron', expr: '0 9 * * *', tz: 'Europe/Oslo' },
      sessionTarget: body.sessionTarget || 'main',
      wakeMode: body.wakeMode || 'now',
      payload: body.payload || { kind: 'systemEvent', text: '' },
      deleteAfterRun: body.deleteAfterRun || false,
      state: {},
    };

    store.jobs.push(newJob);
    writeCronStore(store);

    return NextResponse.json({ job: newJob });
  } catch (error) {
    console.error('Error adding cron job:', error);
    return NextResponse.json({ error: 'Failed to add cron job' }, { status: 500 });
  }
}
