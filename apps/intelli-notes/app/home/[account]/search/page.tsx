import { use } from 'react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { SearchPageClient } from './_components/search-page-client';

interface SearchPageProps {
  params: Promise<{ account: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('meetings:navigation.search', { defaultValue: 'Søk' });

  return {
    title,
  };
};

function SearchPage({ params }: SearchPageProps) {
  const account = use(params).account;

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title={<Trans i18nKey={'meetings:navigation.search'} defaults="Søk i møter" />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <SearchPageClient accountSlug={account} />
      </PageBody>
    </>
  );
}

export default withI18n(SearchPage);
