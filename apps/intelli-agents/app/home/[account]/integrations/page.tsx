import { use } from 'react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { IntegrationsContainer } from './_components/integrations-container';

interface IntegrationsPageProps {
  params: Promise<{ account: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('agents:integrations.pageTitle');

  return {
    title,
  };
};

function IntegrationsPage({ params }: IntegrationsPageProps) {
  const account = use(params).account;

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title={<Trans i18nKey="agents:integrations.pageTitle" defaults="Integrasjoner" />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <IntegrationsContainer accountSlug={account} />
      </PageBody>
    </>
  );
}

export default withI18n(IntegrationsPage);
