import { use } from 'react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { TemplatesContainer } from './_components/templates-container';

interface TemplatesPageProps {
  params: Promise<{ account: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('agents:templates.pageTitle');

  return {
    title,
  };
};

function TemplatesPage({ params }: TemplatesPageProps) {
  const account = use(params).account;

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title={<Trans i18nKey="agents:templates.pageTitle" defaults="Agent Maler" />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <TemplatesContainer accountSlug={account} />
      </PageBody>
    </>
  );
}

export default withI18n(TemplatesPage);
