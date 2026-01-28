'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Pause, Clock, Calendar, Edit2, X, Check } from 'lucide-react';

interface CronJob {
  id: string;
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
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
  };
}

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch('/api/cron');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleJob(job: CronJob) {
    try {
      await fetch(`/api/cron/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !job.enabled }),
      });
      fetchJobs();
    } catch (error) {
      console.error('Failed to toggle job:', error);
    }
  }

  async function deleteJob(jobId: string) {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await fetch(`/api/cron/${jobId}`, { method: 'DELETE' });
      fetchJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  }

  function formatSchedule(schedule: CronJob['schedule']): string {
    if (schedule.kind === 'cron' && schedule.expr) {
      return `${schedule.expr} (${schedule.tz || 'UTC'})`;
    }
    if (schedule.kind === 'every' && schedule.ms) {
      const mins = Math.round(schedule.ms / 60000);
      return `Every ${mins} min`;
    }
    if (schedule.kind === 'at' && schedule.at) {
      return new Date(schedule.at).toLocaleString();
    }
    return 'Unknown';
  }

  function formatTime(ms?: number): string {
    if (!ms) return 'Never';
    return new Date(ms).toLocaleString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cron Jobs</h1>
          <p className="text-gray-600 dark:text-gray-400">Scheduled tasks for Erik</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No cron jobs yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first scheduled task</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            Add Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border ${
                job.enabled 
                  ? 'border-gray-200 dark:border-gray-700' 
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              } p-4 shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      job.enabled 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {job.enabled ? 'Active' : 'Paused'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      job.sessionTarget === 'isolated' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {job.sessionTarget}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatSchedule(job.schedule)}</span>
                    </div>
                    {job.payload.channel && (
                      <div className="flex items-center gap-1">
                        <span>→ {job.payload.channel}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {job.payload.text || job.payload.message || 'No message'}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
                    <span>Next: {formatTime(job.state?.nextRunAtMs)}</span>
                    <span>Last: {formatTime(job.state?.lastRunAtMs)}</span>
                    {job.state?.lastStatus && (
                      <span className={job.state.lastStatus === 'ok' ? 'text-green-600' : 'text-amber-600'}>
                        {job.state.lastStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleJob(job)}
                    className={`p-2 rounded-lg transition-colors ${
                      job.enabled
                        ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={job.enabled ? 'Pause' : 'Enable'}
                  >
                    {job.enabled ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    onClick={() => setEditingJob(job)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingJob) && (
        <JobModal
          job={editingJob}
          onClose={() => {
            setShowAddModal(false);
            setEditingJob(null);
          }}
          onSave={() => {
            fetchJobs();
            setShowAddModal(false);
            setEditingJob(null);
          }}
        />
      )}
    </div>
  );
}

function JobModal({
  job,
  onClose,
  onSave,
}: {
  job: CronJob | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(job?.name || '');
  const [cronExpr, setCronExpr] = useState(job?.schedule?.expr || '0 9 * * *');
  const [timezone, setTimezone] = useState(job?.schedule?.tz || 'Europe/Oslo');
  const [sessionTarget, setSessionTarget] = useState<'main' | 'isolated'>(job?.sessionTarget || 'main');
  const [message, setMessage] = useState(job?.payload?.text || job?.payload?.message || '');
  const [deliver, setDeliver] = useState(job?.payload?.deliver || false);
  const [channel, setChannel] = useState(job?.payload?.channel || 'telegram');
  const [to, setTo] = useState(job?.payload?.to || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = sessionTarget === 'main'
        ? { kind: 'systemEvent' as const, text: message }
        : { kind: 'agentTurn' as const, message, deliver, channel: deliver ? channel : undefined, to: deliver ? to : undefined };

      const body = {
        name,
        schedule: { kind: 'cron' as const, expr: cronExpr, tz: timezone },
        sessionTarget,
        wakeMode: 'now',
        payload,
      };

      if (job) {
        await fetch(`/api/cron/${job.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/cron', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      onSave();
    } catch (error) {
      console.error('Failed to save job:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {job ? 'Edit Job' : 'Add Cron Job'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Report"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cron Expression
              </label>
              <input
                type="text"
                value={cronExpr}
                onChange={(e) => setCronExpr(e.target.value)}
                placeholder="0 9 * * *"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">min hour day month weekday</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Europe/Oslo"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSessionTarget('main')}
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  sessionTarget === 'main'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                Main Session
              </button>
              <button
                onClick={() => setSessionTarget('isolated')}
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  sessionTarget === 'isolated'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                Isolated
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {sessionTarget === 'main' 
                ? 'Runs during heartbeat with full context' 
                : 'Runs in dedicated session, can deliver to channels'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message / Prompt
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="What should Erik do?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {sessionTarget === 'isolated' && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deliver}
                  onChange={(e) => setDeliver(e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Deliver output to channel</span>
              </label>

              {deliver && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Channel</label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="telegram">Telegram</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="discord">Discord</option>
                      <option value="slack">Slack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To (ID)</label>
                    <input
                      type="text"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="6158643640"
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name || !message}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Check size={18} />
            )}
            {job ? 'Save Changes' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  );
}
