'use client';

/**
 * Memory Dashboard Client Component
 * 
 * Interactive dashboard for viewing and managing user personas and memories.
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Skeleton } from '@kit/ui/skeleton';
import { Input } from '@kit/ui/input';
import { 
  Brain, 
  RefreshCw, 
  Search, 
  Mail,
  HelpCircle,
  Users,
  AlertCircle,
  Settings,
  MessageSquare,
  Target,
  Sparkles,
} from 'lucide-react';

import { PersonaOverview } from './persona-overview';
import { EmailComposer } from './email-composer';
import { ProbingQuestions } from './probing-questions';
import {
  type UserPersona,
  type ProbingQuestion,
  type EmailCompositionRequest,
  type ComposedEmail,
  createEmptyPersona,
} from '@kit/memory-core';

interface MemoryDashboardClientProps {
  chatbotId: string;
  accountId: string;
}

// Demo personas for development - in production, these come from the API
const DEMO_PERSONAS: UserPersona[] = [
  {
    id: 'demo-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    chatbotId: undefined,
    name: 'Kari Nordmann',
    email: 'kari@example.no',
    communicationStyle: {
      formality: 0.7,
      verbosity: 0.4,
      directness: 0.8,
      emotionality: 0.3,
      technicality: 0.5,
      preferredLanguage: 'no',
      signatures: [],
      preferredGreetings: ['Hei'],
      preferredSignoffs: ['Mvh'],
    },
    professionalProfile: {
      title: 'CEO',
      company: 'TechStartup AS',
      industry: 'Technology',
      roleType: 'executive',
      yearsExperience: 15,
      responsibilities: ['Strategic planning', 'Investor relations', 'Team leadership'],
      goals: ['Expand to European markets', 'Raise Series B funding'],
      challenges: ['Hiring senior engineers', 'Managing rapid growth'],
      teamSize: 25,
      decisionAuthority: 'final',
    },
    personalPreferences: {
      preferredContactTime: 'morning',
      timezone: 'Europe/Oslo',
      interests: ['AI/ML', 'Sustainability', 'Leadership'],
      avoidTopics: [],
      infoFormat: 'bullets',
      urgencyLevel: 'same-day',
      meetingDuration: 30,
    },
    relationships: {
      keyPeople: [
        { name: 'Lars Hansen', relationship: 'CTO', notes: 'Co-founder' },
        { name: 'Maria Olsen', relationship: 'CFO' },
      ],
      organizations: [
        { name: 'Innovation Norway', relationship: 'Grant recipient' },
      ],
      importantDates: [
        { date: '2025-03-15', description: 'Board meeting', recurring: true },
      ],
    },
    facts: {
      professional: [
        'Founded TechStartup AS in 2020',
        'Previously worked at DNB as IT Director',
      ],
      preferences: [
        'Prefers morning meetings',
        'Likes concise communication',
      ],
    },
    overallConfidence: 0.75,
    conversationsAnalyzed: 23,
    lastUpdated: new Date(),
    createdAt: new Date('2024-06-15'),
    version: 5,
  },
];

// Demo probing questions
const DEMO_QUESTIONS: ProbingQuestion[] = [
  {
    id: 'prof-1',
    category: 'professional',
    question: "What's your role at your company?",
    questionNo: 'Hva er din rolle i bedriften?',
    followUpQuestions: ['What are your main responsibilities?'],
    personaFields: ['professionalProfile.title'],
    priority: 10,
    askedCount: 45,
    successRate: 0.85,
  },
  {
    id: 'goals-1',
    category: 'goals',
    question: 'What are your main goals for the next quarter?',
    questionNo: 'Hva er hovedmålene dine for neste kvartal?',
    followUpQuestions: ['What would success look like?'],
    personaFields: ['professionalProfile.goals'],
    priority: 8,
    askedCount: 32,
    successRate: 0.7,
  },
  {
    id: 'comm-1',
    category: 'communication',
    question: 'Do you prefer formal or casual communication?',
    questionNo: 'Foretrekker du formell eller uformell kommunikasjon?',
    followUpQuestions: [],
    personaFields: ['communicationStyle.formality'],
    priority: 6,
    askedCount: 28,
    successRate: 0.9,
  },
  {
    id: 'challenges-1',
    category: 'challenges',
    question: 'What are the biggest challenges you face at work?',
    questionNo: 'Hva er de største utfordringene du står overfor på jobb?',
    followUpQuestions: ['How are you addressing these?'],
    personaFields: ['professionalProfile.challenges'],
    priority: 8,
    askedCount: 20,
    successRate: 0.75,
  },
  {
    id: 'pref-1',
    category: 'preferences',
    question: 'How do you like information presented?',
    questionNo: 'Hvordan liker du at informasjon presenteres?',
    followUpQuestions: [],
    personaFields: ['personalPreferences.infoFormat'],
    priority: 5,
    askedCount: 15,
    successRate: 0.8,
  },
];

export function MemoryDashboardClient({
  chatbotId,
  accountId,
}: MemoryDashboardClientProps) {
  const [personas, setPersonas] = useState<UserPersona[]>([]);
  const [questions, setQuestions] = useState<ProbingQuestion[]>(DEMO_QUESTIONS);
  const [askedQuestionIds, setAskedQuestionIds] = useState<string[]>(['prof-1']);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<UserPersona | null>(null);

  useEffect(() => {
    // In production, fetch from API
    // For now, use demo data
    setTimeout(() => {
      setPersonas(DEMO_PERSONAS);
      setSelectedPersona(DEMO_PERSONAS[0] ?? null);
      setIsLoading(false);
    }, 500);
  }, [chatbotId]);

  const handleComposeEmail = async (request: EmailCompositionRequest): Promise<ComposedEmail> => {
    // In production, this would call the API
    // For demo, return a composed email based on the persona
    await new Promise(resolve => setTimeout(resolve, 1000));

    const persona = selectedPersona ?? DEMO_PERSONAS[0]!;
    const isNorwegian = persona.communicationStyle.preferredLanguage === 'no';
    const isFormal = persona.communicationStyle.formality > 0.6;

    const greeting = isNorwegian 
      ? (isFormal ? `Hei ${request.recipient},` : `Hei ${request.recipient}!`)
      : (isFormal ? `Dear ${request.recipient},` : `Hi ${request.recipient},`);

    const opening = isNorwegian
      ? 'Takk for sist. Jeg skriver angående ' + request.purpose.toLowerCase() + '.'
      : 'Thank you for your time. I am writing regarding ' + request.purpose.toLowerCase() + '.';

    const points = request.keyPoints.map(p => `• ${p}`).join('\n');

    const closing = isNorwegian
      ? 'Gi meg beskjed om du har spørsmål.'
      : 'Please let me know if you have any questions.';

    const signoff = isNorwegian
      ? (isFormal ? 'Med vennlig hilsen,' : 'Beste hilsen,')
      : (isFormal ? 'Best regards,' : 'Thanks,');

    const body = `${greeting}\n\n${opening}\n\n${points}\n\n${closing}\n\n${signoff}\n${persona.name ?? 'Your Name'}`;

    return {
      subject: request.purpose,
      body,
      confidenceScore: persona.overallConfidence,
      styleMatchScore: 0.85,
      suggestedFollowUp: isNorwegian 
        ? 'Følg opp om 2-3 dager hvis du ikke har fått svar.'
        : 'Follow up in 2-3 days if no response.',
    };
  };

  const handleQuestionAsked = (questionId: string) => {
    setAskedQuestionIds([...askedQuestionIds, questionId]);
  };

  const filteredPersonas = personas.filter(p => 
    !searchQuery || 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.professionalProfile.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalMemories = personas.reduce(
    (acc, p) => acc + Object.values(p.facts).flat().length,
    0
  );
  const avgConfidence = personas.length > 0
    ? personas.reduce((acc, p) => acc + p.overallConfidence, 0) / personas.length
    : 0;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Active Users"
          value={personas.length.toString()}
          description="With stored memories"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Facts"
          value={totalMemories.toString()}
          description="Learned about users"
          icon={<Brain className="h-4 w-4" />}
        />
        <StatsCard
          title="Avg. Confidence"
          value={`${Math.round(avgConfidence * 100)}%`}
          description="Persona accuracy"
          icon={<Target className="h-4 w-4" />}
        />
        <StatsCard
          title="Questions Asked"
          value={askedQuestionIds.length.toString()}
          description={`of ${questions.length} available`}
          icon={<HelpCircle className="h-4 w-4" />}
        />
      </div>

      {/* Info Alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Persona Learning Active</AlertTitle>
        <AlertDescription>
          Your chatbot is automatically learning about users from conversations. 
          Use the tools below to manage what it knows and compose personalized emails.
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs defaultValue="personas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personas" className="gap-2">
            <Users className="h-4 w-4" />
            User Personas
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <Mail className="h-4 w-4" />
            Email Composer
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Learning Questions
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Personas Tab */}
        <TabsContent value="personas">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Personas</CardTitle>
                  <CardDescription>
                    What your chatbot has learned about users
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPersonas.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  {filteredPersonas.map((persona) => (
                    <PersonaOverview
                      key={persona.id}
                      persona={persona}
                      onEdit={(id) => console.log('Edit persona:', id)}
                      onDelete={(id) => console.log('Delete persona:', id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Composer Tab */}
        <TabsContent value="compose">
          {selectedPersona ? (
            <EmailComposer
              persona={selectedPersona}
              onCompose={handleComposeEmail}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a user persona to compose emails in their style</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          {selectedPersona ? (
            <ProbingQuestions
              persona={selectedPersona}
              questions={questions}
              askedQuestionIds={askedQuestionIds}
              language="no"
              onQuestionAsked={handleQuestionAsked}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a user to see recommended learning questions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Memory Settings</CardTitle>
              <CardDescription>
                Configure how your chatbot learns and remembers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <SettingRow
                  title="Memory Retention"
                  description="How long to keep memories before decay"
                  value="90 days"
                />
                <SettingRow
                  title="Auto-extraction"
                  description="Automatically extract facts from conversations"
                  value="Enabled"
                />
                <SettingRow
                  title="Confidence Threshold"
                  description="Minimum confidence to use a memory"
                  value="0.6"
                />
                <SettingRow
                  title="Language"
                  description="Primary language for persona detection"
                  value="Norwegian"
                />
                <SettingRow
                  title="Probing Questions"
                  description="Automatically ask learning questions"
                  value="Enabled"
                />
                <SettingRow
                  title="Max Questions/Conv"
                  description="Maximum questions per conversation"
                  value="2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function SettingRow({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
      <h3 className="text-lg font-medium mb-2">No personas yet</h3>
      <p className="max-w-md mx-auto">
        Your chatbot will start learning about users once conversations begin.
        Personas are automatically created and updated as users interact.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
