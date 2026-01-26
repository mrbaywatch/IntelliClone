import { use } from 'react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { MeetingsPageClient } from './_components/meetings-page-client';

interface MeetingsPageProps {
  params: Promise<{ account: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('meetings:pageTitle', { defaultValue: 'Møter' });

  return {
    title,
  };
};

function MeetingsPage({ params }: MeetingsPageProps) {
  const account = use(params).account;

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title={<Trans i18nKey={'meetings:pageTitle'} defaults="Møter" />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <MeetingsPageClient accountSlug={account} />
      </PageBody>
    </>
  );
}

export default withI18n(MeetingsPage);
