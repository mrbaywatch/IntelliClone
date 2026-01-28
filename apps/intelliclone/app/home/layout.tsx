import { use } from 'react';

import { UserWorkspaceContextProvider } from '@kit/accounts/components';

import { withI18n } from '~/lib/i18n/with-i18n';
import { LanguageProvider } from '~/lib/language-context';

import { loadUserWorkspace } from './_lib/load-user-workspace';

function HomeLayout({ children }: React.PropsWithChildren) {
  const workspace = use(loadUserWorkspace());

  return (
    <UserWorkspaceContextProvider value={workspace}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </UserWorkspaceContextProvider>
  );
}

export default withI18n(HomeLayout);
