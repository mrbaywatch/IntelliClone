/**
 * Memory Dashboard for IntelliClone
 * 
 * Shows what the chatbot remembers about users and provides tools for
 * managing user personas.
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { 
  Brain, 
  Trash2, 
  RefreshCw, 
  Search, 
  Mail,
  HelpCircle,
  Users,
  AlertCircle,
  Settings,
} from 'lucide-react';

import { loadChatbot } from '../../_lib/server/load-chatbot';
import { MemoryDashboardClient } from './_components/memory-dashboard-client';

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
        title="Memories & Personas"
        description="See what your chatbot learns about users"
      />

      <PageBody>
        <Suspense fallback={<DashboardSkeleton />}>
          <MemoryDashboardClient chatbotId={chatbot} accountId={account} />
        </Suspense>
      </PageBody>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
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
      
      {/* Tabs Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
