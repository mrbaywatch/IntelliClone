import { use } from 'react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../../_components/team-account-layout-page-header';
import { AgentDetailContainer } from './_components/agent-detail-container';

interface AgentDetailPageProps {
  params: Promise<{ account: string; agentId: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('agents:detail.pageTitle');

  return {
    title,
  };
};

function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { account, agentId } = use(params);

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title={<Trans i18nKey="agents:detail.pageTitle" defaults="Agent Detaljer" />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <AgentDetailContainer accountSlug={account} agentId={agentId} />
      </PageBody>
    </>
  );
}

export default withI18n(AgentDetailPage);
