'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckSquare,
  Sparkles,
  Upload,
  Play,
  Pause,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Separator } from '@kit/ui/separator';
import { Checkbox } from '@kit/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kit/ui/collapsible';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@kit/ui/alert';
import { Input } from '@kit/ui/input';

import type {
  MeetingWithDetails,
  ActionItem,
  MeetingSummary,
  TranscriptSegment,
} from '~/lib/meetings/types';

// =============================================================================
// Types
// =============================================================================

interface MeetingDetailClientProps {
  accountSlug: string;
  meetingId: string;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchMeetingDetails(meetingId: string): Promise<MeetingWithDetails> {
  const response = await fetch(`/api/meetings/${meetingId}?details=true`);
  if (!response.ok) throw new Error('Failed to fetch meeting');
  return response.json();
}

async function startTranscription(meetingId: string, audioUrl: string): Promise<void> {
  const response = await fetch(`/api/meetings/${meetingId}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_url: audioUrl }),
  });
  if (!response.ok) throw new Error('Failed to start transcription');
}

async function generateSummary(meetingId: string): Promise<MeetingSummary> {
  const response = await fetch(`/api/meetings/${meetingId}/summary`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to generate summary');
  const data = await response.json();
  return data.summary;
}

async function updateActionItemStatus(
  actionItemId: string,
  status: ActionItem['status']
): Promise<void> {
  const response = await fetch(`/api/action-items/${actionItemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update action item');
}

// =============================================================================
// Status Badge Component
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    scheduled: { label: 'Planlagt', variant: 'outline' },
    recording: { label: 'Opptak pågår', variant: 'default' },
    processing: { label: 'Behandler...', variant: 'secondary' },
    completed: { label: 'Fullført', variant: 'default' },
    failed: { label: 'Feilet', variant: 'destructive' },
  };

  const { label, variant } = variants[status] || { label: status, variant: 'outline' };
  return <Badge variant={variant}>{label}</Badge>;
}

// =============================================================================
// Transcript View Component
// =============================================================================

function TranscriptView({ 
  transcript, 
  segments 
}: { 
  transcript?: { full_text: string; word_count?: number };
  segments?: TranscriptSegment[];
}) {
  const [showSpeakers, setShowSpeakers] = useState(true);

  if (!transcript) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Ingen transkripsjon ennå</h3>
        <p className="text-muted-foreground mt-2">
          Last opp en lydopptak for å starte transkriberingen.
        </p>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript.full_text);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {transcript.word_count && (
            <span>{transcript.word_count.toLocaleString('nb-NO')} ord</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Kopier
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Last ned
          </Button>
        </div>
      </div>

      {segments && segments.length > 0 && showSpeakers ? (
        <div className="space-y-3">
          {segments.map((segment, index) => (
            <div key={segment.id || index} className="flex gap-3">
              <div className="flex-shrink-0 w-24">
                <Badge variant="outline" className="text-xs">
                  {segment.speaker_label || `Taler ${index + 1}`}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTime(segment.start_time_ms)}
                </div>
              </div>
              <p className="flex-1 text-sm leading-relaxed">{segment.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap leading-relaxed">{transcript.full_text}</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Summary View Component
// =============================================================================

function SummaryView({ summary }: { summary?: MeetingSummary }) {
  const [keyPointsOpen, setKeyPointsOpen] = useState(true);
  const [decisionsOpen, setDecisionsOpen] = useState(true);
  const [topicsOpen, setTopicsOpen] = useState(true);

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Ingen oppsummering ennå</h3>
        <p className="text-muted-foreground mt-2">
          Generer en AI-oppsummering etter at transkripsjonen er fullført.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sammendrag</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{summary.summary_text}</p>
        </CardContent>
      </Card>

      {/* Key Points */}
      {summary.key_points && summary.key_points.length > 0 && (
        <Collapsible open={keyPointsOpen} onOpenChange={setKeyPointsOpen}>
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setKeyPointsOpen(!keyPointsOpen)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Nøkkelpunkter</CardTitle>
                  {keyPointsOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <ul className="space-y-2">
                  {summary.key_points.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{point.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Decisions */}
      {summary.decisions && summary.decisions.length > 0 && (
        <Collapsible open={decisionsOpen} onOpenChange={setDecisionsOpen}>
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setDecisionsOpen(!decisionsOpen)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Beslutninger</CardTitle>
                  {decisionsOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <ul className="space-y-2">
                  {summary.decisions.map((decision, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{decision.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Topics */}
      {summary.topics && summary.topics.length > 0 && (
        <Collapsible open={topicsOpen} onOpenChange={setTopicsOpen}>
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setTopicsOpen(!topicsOpen)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Temaer diskutert</CardTitle>
                  {topicsOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {summary.topics.map((topic, index) => (
                    <div key={index} className="border-l-2 border-primary pl-3">
                      <h4 className="font-medium text-sm">{topic.name}</h4>
                      {topic.summary && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {topic.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}

// =============================================================================
// Action Items View Component
// =============================================================================

function ActionItemsView({
  actionItems,
  onStatusChange,
}: {
  actionItems?: ActionItem[];
  onStatusChange: (id: string, status: ActionItem['status']) => void;
}) {
  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Ingen handlingspunkter</h3>
        <p className="text-muted-foreground mt-2">
          Handlingspunkter vil bli automatisk hentet fra møtet.
        </p>
      </div>
    );
  }

  const pendingItems = actionItems.filter((item) => item.status === 'pending');
  const completedItems = actionItems.filter((item) => item.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Ventende ({pendingItems.length})
          </h3>
          {pendingItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-3 pt-4">
                <Checkbox
                  checked={item.status === 'completed'}
                  onCheckedChange={(checked) =>
                    onStatusChange(item.id, checked ? 'completed' : 'pending')
                  }
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  {item.assignee_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Tildelt: {item.assignee_name}
                    </p>
                  )}
                  {item.due_date && (
                    <p className="text-xs text-muted-foreground">
                      Frist: {format(new Date(item.due_date), 'PPP', { locale: nb })}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    item.priority === 'urgent'
                      ? 'destructive'
                      : item.priority === 'high'
                      ? 'default'
                      : 'outline'
                  }
                >
                  {item.priority === 'urgent'
                    ? 'Haster'
                    : item.priority === 'high'
                    ? 'Høy'
                    : item.priority === 'medium'
                    ? 'Medium'
                    : 'Lav'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Fullført ({completedItems.length})
          </h3>
          {completedItems.map((item) => (
            <Card key={item.id} className="opacity-60">
              <CardContent className="flex items-start gap-3 pt-4">
                <Checkbox
                  checked={true}
                  onCheckedChange={(checked) =>
                    onStatusChange(item.id, checked ? 'completed' : 'pending')
                  }
                />
                <div className="flex-1">
                  <p className="font-medium text-sm line-through">{item.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Upload Audio Component
// =============================================================================

function UploadAudio({
  meetingId,
  onUploadComplete,
}: {
  meetingId: string;
  onUploadComplete: () => void;
}) {
  const [audioUrl, setAudioUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = async () => {
    if (!audioUrl) return;
    setIsUploading(true);
    try {
      await startTranscription(meetingId, audioUrl);
      onUploadComplete();
    } catch (error) {
      console.error('Failed to start transcription:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Last opp lydopptak
        </CardTitle>
        <CardDescription>
          Legg til en URL til lydopptaket for å starte transkriberingen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/meeting-recording.mp3"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
          />
          <Button onClick={handleUrlSubmit} disabled={!audioUrl || isUploading}>
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Start'
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Støttede formater: MP3, WAV, M4A, WEBM, OGG
        </p>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// =============================================================================
// Main Component
// =============================================================================

export function MeetingDetailClient({
  accountSlug,
  meetingId,
}: MeetingDetailClientProps) {
  const queryClient = useQueryClient();

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => fetchMeetingDetails(meetingId),
    refetchInterval: (query) => {
      // Poll while processing
      const data = query.state.data;
      if (data?.status === 'processing') return 5000;
      return false;
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: () => generateSummary(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });

  const updateActionItemMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionItem['status'] }) =>
      updateActionItemStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Feil</AlertTitle>
        <AlertDescription>
          Kunne ikke laste møtedetaljer. Prøv igjen senere.
        </AlertDescription>
      </Alert>
    );
  }

  const formattedDate = meeting.scheduled_start
    ? format(new Date(meeting.scheduled_start), 'PPPp', { locale: nb })
    : format(new Date(meeting.created_at), 'PPPp', { locale: nb });

  const duration = meeting.duration_seconds
    ? `${Math.floor(meeting.duration_seconds / 60)} minutter`
    : null;

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/home/${accountSlug}/meetings`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <StatusBadge status={meeting.status} />
          </div>
          {meeting.description && (
            <p className="text-muted-foreground mt-1">{meeting.description}</p>
          )}
        </div>
      </div>

      {/* Meeting Info */}
      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>
        {duration && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{duration}</span>
          </div>
        )}
        {meeting.participants && meeting.participants.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{meeting.participants.length} deltakere</span>
          </div>
        )}
      </div>

      {/* Processing Alert */}
      {meeting.status === 'processing' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Behandler opptak</AlertTitle>
          <AlertDescription>
            Transkripsjonen pågår. Dette kan ta noen minutter avhengig av lengden
            på opptaket.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {meeting.status === 'failed' && meeting.processing_error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Behandling feilet</AlertTitle>
          <AlertDescription>{meeting.processing_error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Audio (if no transcript yet) */}
      {meeting.status === 'scheduled' && (
        <UploadAudio meetingId={meetingId} onUploadComplete={handleRefresh} />
      )}

      {/* Main Content Tabs */}
      {(meeting.status === 'completed' || meeting.transcript) && (
        <Tabs defaultValue="transcript" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="transcript" className="gap-2">
                <FileText className="h-4 w-4" />
                Transkripsjon
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Oppsummering
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Handlingspunkter
                {meeting.action_items && meeting.action_items.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {meeting.action_items.filter((a) => a.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {meeting.transcript && !meeting.summary && (
              <Button
                onClick={() => generateSummaryMutation.mutate()}
                disabled={generateSummaryMutation.isPending}
              >
                {generateSummaryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generer oppsummering
              </Button>
            )}
          </div>

          <TabsContent value="transcript" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <TranscriptView transcript={meeting.transcript} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <SummaryView summary={meeting.summary} />
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <ActionItemsView
              actionItems={meeting.action_items}
              onStatusChange={(id, status) =>
                updateActionItemMutation.mutate({ id, status })
              }
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
