import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarNavigation,
} from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { personalAccountNavigationConfig } from '~/config/personal-account-navigation.config';

import type { UserWorkspace } from '../_lib/load-user-workspace';

interface SimpleSidebarProps {
  workspace: UserWorkspace;
}

export function SimpleSidebar(props: SimpleSidebarProps) {
  const { workspace, user } = props.workspace;
  const collapsible = personalAccountNavigationConfig.sidebarCollapsedStyle;

  return (
    <Sidebar collapsible={collapsible}>
      <SidebarHeader className={'h-16 justify-center'}>
        <div className={'flex items-center justify-between gap-x-3'}>
          <AppLogo className="p-2 group-data-[minimized=true]/sidebar:max-w-full group-data-[minimized=true]/sidebar:py-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarNavigation config={personalAccountNavigationConfig} />
      </SidebarContent>

      <SidebarFooter>
        <ProfileAccountDropdownContainer user={user} account={workspace} />
      </SidebarFooter>
    </Sidebar>
  );
}
