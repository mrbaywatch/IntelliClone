'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckSquare,
  MoreVertical,
  Video,
  Upload,
  Loader2,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import type { Meeting, MeetingStatus, MeetingPlatform } from '~/lib/meetings/types';

// =============================================================================
// Types
// =============================================================================

interface MeetingsPageClientProps {
  accountSlug: string;
}

interface MeetingsResponse {
  meetings: Meeting[];
  total: number;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchMeetings(
  accountId: string,
  status?: MeetingStatus
): Promise<MeetingsResponse> {
  const params = new URLSearchParams({ account_id: accountId });
  if (status) params.set('status', status);

  const response = await fetch(`/api/meetings?${params}`);
  if (!response.ok) throw new Error('Failed to fetch meetings');
  return response.json();
}

async function createMeeting(data: {
  account_id: string;
  title: string;
  description?: string;
  platform?: MeetingPlatform;
  scheduled_start?: string;
}): Promise<Meeting> {
  const response = await fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create meeting');
  return response.json();
}

async function deleteMeeting(meetingId: string): Promise<void> {
  const response = await fetch(`/api/meetings/${meetingId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete meeting');
}

// =============================================================================
// Status Badge Component
// =============================================================================

function StatusBadge({ status }: { status: MeetingStatus }) {
  const variants: Record<MeetingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    scheduled: { label: 'Planlagt', variant: 'outline' },
    recording: { label: 'Opptak pågår', variant: 'default' },
    processing: { label: 'Behandler', variant: 'secondary' },
    completed: { label: 'Fullført', variant: 'default' },
    failed: { label: 'Feilet', variant: 'destructive' },
  };

  const { label, variant } = variants[status] || { label: status, variant: 'outline' };

  return <Badge variant={variant}>{label}</Badge>;
}

// =============================================================================
// Platform Icon Component
// =============================================================================

function PlatformIcon({ platform }: { platform: MeetingPlatform }) {
  switch (platform) {
    case 'zoom':
      return <Video className="h-4 w-4 text-blue-500" />;
    case 'teams':
      return <Video className="h-4 w-4 text-purple-500" />;
    case 'google_meet':
      return <Video className="h-4 w-4 text-green-500" />;
    case 'manual_upload':
      return <Upload className="h-4 w-4 text-gray-500" />;
    default:
      return <Video className="h-4 w-4" />;
  }
}

// =============================================================================
// Meeting Card Component
// =============================================================================

function MeetingCard({
  meeting,
  onDelete,
}: {
  meeting: Meeting;
  onDelete: (id: string) => void;
}) {
  const formattedDate = meeting.scheduled_start
    ? format(new Date(meeting.scheduled_start), 'PPP', { locale: nb })
    : format(new Date(meeting.created_at), 'PPP', { locale: nb });

  const formattedTime = meeting.scheduled_start
    ? format(new Date(meeting.scheduled_start), 'HH:mm', { locale: nb })
    : null;

  const duration = meeting.duration_seconds
    ? `${Math.floor(meeting.duration_seconds / 60)} min`
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={meeting.platform} />
            <CardTitle className="text-lg">{meeting.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={meeting.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={`/home/${meeting.account_id}/meetings/${meeting.id}`}>
                    Se detaljer
                  </a>
                </DropdownMenuItem>
                {meeting.status === 'completed' && (
                  <>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Se transkripsjon
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Se handlingspunkter
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(meeting.id)}
                >
                  Slett møte
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {meeting.description && (
          <CardDescription className="line-clamp-2">
            {meeting.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          {formattedTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formattedTime}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Create Meeting Dialog
// =============================================================================

function CreateMeetingDialog({
  accountId,
  onCreated,
}: {
  accountId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<MeetingPlatform>('manual_upload');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createMeeting({
        account_id: accountId,
        title,
        description: description || undefined,
        platform,
      });
      setOpen(false);
      setTitle('');
      setDescription('');
      onCreated();
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nytt møte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Opprett nytt møte</DialogTitle>
            <DialogDescription>
              Legg til et nytt møte for transkribering og oppsummering.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Tittel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="F.eks. Ukentlig statusmøte"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kort beskrivelse av møtet..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platform">Plattform</Label>
              <Select
                value={platform}
                onValueChange={(v) => setPlatform(v as MeetingPlatform)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_upload">Manuell opplasting</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="google_meet">Google Meet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting || !title}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Opprett møte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function MeetingsPageClient({ accountSlug }: MeetingsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');
  const queryClient = useQueryClient();

  // For now, use the account slug as the ID (in real app, would resolve this)
  const accountId = accountSlug;

  const { data, isLoading, error } = useQuery({
    queryKey: ['meetings', accountId, statusFilter],
    queryFn: () =>
      fetchMeetings(accountId, statusFilter === 'all' ? undefined : statusFilter),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
  };

  const filteredMeetings = data?.meetings.filter((meeting) =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Kunne ikke laste møter. Prøv igjen senere.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søk i møter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as MeetingStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              <SelectItem value="scheduled">Planlagt</SelectItem>
              <SelectItem value="recording">Opptak pågår</SelectItem>
              <SelectItem value="processing">Behandler</SelectItem>
              <SelectItem value="completed">Fullført</SelectItem>
              <SelectItem value="failed">Feilet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CreateMeetingDialog accountId={accountId} onCreated={handleRefresh} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totalt møter</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fullførte</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.meetings.filter((m) => m.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Under behandling</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.meetings.filter((m) => m.status === 'processing').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planlagte</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.meetings.filter((m) => m.status === 'scheduled').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meetings List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMeetings && filteredMeetings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center h-64">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Ingen møter ennå</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2">
            Kom i gang ved å opprette ditt første møte og last opp en lydopptak for
            automatisk transkribering og oppsummering.
          </p>
          <CreateMeetingDialog accountId={accountId} onCreated={handleRefresh} />
        </Card>
      )}
    </div>
  );
}
