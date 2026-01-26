/**
 * Memory Dashboard for IntelliClone
 * 
 * Shows what the chatbot remembers about users.
 * This is a key differentiator - transparency into the AI's memory.
 */

import { Suspense } from 'react';

import { PageBody, PageHeader } from '@kit/ui/page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Skeleton } from '@kit/ui/skeleton';
import { Brain, Trash2, RefreshCw, Search } from 'lucide-react';

import { loadChatbot } from '../../_lib/server/load-chatbot';

interface PageParams {
  params: Promise<{
    account: string;
    chatbot: string;
  }>;
}

export default async function MemoriesPage({ params }: PageParams) {
  const { account, chatbot } = await params;

  const data = await loadChatbot({
    accountSlug: account,
    chatbotId: chatbot,
  });

  return (
    <>
      <PageHeader
        title="Memories"
        description="See what your chatbot remembers about users"
      />

      <PageBody>
        <div className="flex flex-col gap-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatsCard
              title="Total Memories"
              value="--"
              description="Across all users"
              icon={<Brain className="h-4 w-4" />}
            />
            <StatsCard
              title="Active Users"
              value="--"
              description="With stored memories"
              icon={<Brain className="h-4 w-4" />}
            />
            <StatsCard
              title="Facts Learned"
              value="--"
              description="User facts & preferences"
              icon={<Brain className="h-4 w-4" />}
            />
            <StatsCard
              title="Memory Health"
              value="--"
              description="Avg confidence score"
              icon={<Brain className="h-4 w-4" />}
            />
          </div>

          {/* Memory Types Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Memory Overview
              </CardTitle>
              <CardDescription>
                What your chatbot has learned about users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary">Facts: --</Badge>
                <Badge variant="secondary">Preferences: --</Badge>
                <Badge variant="secondary">Events: --</Badge>
                <Badge variant="secondary">Relationships: --</Badge>
                <Badge variant="secondary">Goals: --</Badge>
                <Badge variant="secondary">Context: --</Badge>
              </div>

              <div className="text-muted-foreground text-sm">
                <p className="mb-4">
                  Memory storage requires a database connection. 
                  Please set up Supabase to enable the memory system.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search Memories
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Memories */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Memories</CardTitle>
              <CardDescription>
                The latest things your chatbot has learned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<MemoriesSkeleton />}>
                <MemoriesPlaceholder />
              </Suspense>
            </CardContent>
          </Card>

          {/* Memory Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Memory Settings</CardTitle>
              <CardDescription>
                Configure how your chatbot remembers users
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
                  value="0.7"
                />
                <SettingRow
                  title="Norwegian Language"
                  description="Extract Norwegian names, places, organizations"
                  value="Enabled"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
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
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}

function MemoriesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MemoriesPlaceholder() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium mb-2">No memories yet</p>
      <p className="text-sm">
        Your chatbot will start remembering things about users once
        conversations begin and the database is connected.
      </p>
    </div>
  );
}
