import { Book, CreditCard, User, MessageSquare, FileSearch, Scale, FolderOpen, Briefcase, BookOpen, FileText } from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import featureFlagsConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'common:routes.application',
    children: [
      {
        label: 'Hjem',
        path: pathsConfig.app.home,
        Icon: <Scale className={iconClasses} />,
        end: true,
      },
      {
        label: 'Dokumenter',
        path: '/home/documents',
        Icon: <FolderOpen className={iconClasses} />,
      },
      {
        label: 'Kontraktsgjennomgang',
        path: '/home/review',
        Icon: <FileSearch className={iconClasses} />,
      },
      {
        label: 'Juridisk Chat',
        path: '/home/chat',
        Icon: <MessageSquare className={iconClasses} />,
      },
      {
        label: 'Saker',
        path: '/home/cases',
        Icon: <Briefcase className={iconClasses} />,
      },
      {
        label: 'Maler',
        path: '/home/templates',
        Icon: <FileText className={iconClasses} />,
      },
      {
        label: 'Juridisk Søk',
        path: '/home/research',
        Icon: <BookOpen className={iconClasses} />,
      },
    ],
  },
  {
    label: 'common:routes.settings',
    children: [
      {
        label: 'common:routes.profile',
        path: pathsConfig.app.personalAccountSettings,
        Icon: <User className={iconClasses} />,
      },
      featureFlagsConfig.enablePersonalAccountBilling
        ? {
            label: 'common:routes.billing',
            path: pathsConfig.app.personalAccountBilling,
            Icon: <CreditCard className={iconClasses} />,
          }
        : undefined,
    ].filter((route) => !!route),
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const personalAccountNavigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_USER_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
  sidebarCollapsedStyle: process.env.NEXT_PUBLIC_SIDEBAR_COLLAPSIBLE_STYLE,
});
