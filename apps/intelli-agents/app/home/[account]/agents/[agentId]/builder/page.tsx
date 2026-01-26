import { use } from 'react';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { AgentBuilderContainer } from './_components/agent-builder-container';

interface AgentBuilderPageProps {
  params: Promise<{ account: string; agentId: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('agents:builder.pageTitle');

  return {
    title,
  };
};

function AgentBuilderPage({ params }: AgentBuilderPageProps) {
  const { account, agentId } = use(params);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <AgentBuilderContainer accountSlug={account} agentId={agentId} />
    </div>
  );
}

export default withI18n(AgentBuilderPage);
