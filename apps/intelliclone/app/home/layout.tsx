import { withI18n } from '~/lib/i18n/with-i18n';
import { LanguageProvider } from '~/lib/language-context';

function HomeLayout({ children }: React.PropsWithChildren) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}

export default withI18n(HomeLayout);
