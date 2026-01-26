'use server';

import { Suspense } from 'react';

import { MessageSquare, Sparkles, Scale } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody, PageHeader } from '@kit/ui/page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { LegalChatContainer } from './_components/legal-chat-container';
import { SuggestedQuestions } from './_components/suggested-questions';
import { RecentChats } from './_components/recent-chats';

async function LegalChatPage() {
  const { id: accountId } = await requireUserInServerComponent();
  const client = getSupabaseServerClient();

  // Fetch recent chat sessions
  const { data: recentSessions } = await client
    .from('legal_chat_sessions')
    .select('id, title, category, created_at, updated_at')
    .eq('account_id', accountId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(5);

  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6" />
            <Trans i18nKey="chat:legalAssistant" defaults="Juridisk Assistent" />
          </div>
        }
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-16rem)]">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Norsk juridisk AI-assistent</CardTitle>
                </div>
                <CardDescription>
                  Still spørsmål om norsk lov, få hjelp med kontrakter, eller få forklart juridiske begreper.
                  Jeg kjenner norsk lovgivning og kan hjelpe deg med de fleste juridiske spørsmål.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-5rem)]">
                <LegalChatContainer accountId={accountId} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Suggested Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Foreslåtte spørsmål
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SuggestedQuestions />
              </CardContent>
            </Card>

            {/* Recent Conversations */}
            {recentSessions && recentSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nylige samtaler</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentChats sessions={recentSessions || []} />
                </CardContent>
              </Card>
            )}

            {/* Disclaimer */}
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-4">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>⚠️ Viktig:</strong> Dette er et AI-verktøy som gir generell juridisk informasjon.
                  Svarene erstatter ikke profesjonell juridisk rådgivning. Kontakt en advokat for konkret
                  veiledning i din sak.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(LegalChatPage);
