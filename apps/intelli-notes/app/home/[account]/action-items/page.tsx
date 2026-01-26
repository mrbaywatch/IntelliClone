import { use } from 'react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { ActionItemsPageClient } from './_components/action-items-page-client';

interface ActionItemsPageProps {
  params: Promise<{ account: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('meetings:navigation.actionItems', { defaultValue: 'Handlingspunkter' });

  return {
    title,
  };
};

function ActionItemsPage({ params }: ActionItemsPageProps) {
  const account = use(params).account;

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title={<Trans i18nKey={'meetings:navigation.actionItems'} defaults="Handlingspunkter" />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <ActionItemsPageClient accountSlug={account} />
      </PageBody>
    </>
  );
}

export default withI18n(ActionItemsPage);
