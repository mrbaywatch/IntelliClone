import { use } from 'react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../../_components/team-account-layout-page-header';
import { MeetingDetailClient } from './_components/meeting-detail-client';

interface MeetingDetailPageProps {
  params: Promise<{ account: string; meetingId: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('meetings:detail.pageTitle', { defaultValue: 'Møtedetaljer' });

  return {
    title,
  };
};

function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { account, meetingId } = use(params);

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title="Møtedetaljer"
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <MeetingDetailClient accountSlug={account} meetingId={meetingId} />
      </PageBody>
    </>
  );
}

export default withI18n(MeetingDetailPage);
