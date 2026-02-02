import Link from 'next/link';

import { SignInMethodsContainer } from '@kit/auth/sign-in';
import { getSafeRedirectPath } from '@kit/shared/utils';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

interface SignInPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:signIn'),
  };
};

async function SignInPage({ searchParams }: SignInPageProps) {
  const { next } = await searchParams;

  const paths = {
    callback: pathsConfig.auth.callback,
    returnPath: getSafeRedirectPath(next, pathsConfig.app.home),
    joinTeam: pathsConfig.app.joinTeam,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-gray-500 text-sm">
          Sign in to continue to your account
        </p>
      </div>

      {/* Sign in form */}
      <div className="auth-form-clean">
        <SignInMethodsContainer
          paths={paths}
          providers={authConfig.providers}
          captchaSiteKey={authConfig.captchaTokenSiteKey}
        />
      </div>

      {/* Footer link */}
      <div className="text-center pt-2">
        <span className="text-sm text-gray-500">
          Don't have an account?{' '}
          <Link 
            href={pathsConfig.auth.signUp} 
            className="text-gray-900 font-medium hover:underline"
          >
            Sign up
          </Link>
        </span>
      </div>
    </div>
  );
}

export default withI18n(SignInPage);
