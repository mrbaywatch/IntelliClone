import Link from 'next/link';

import { SignUpMethodsContainer } from '@kit/auth/sign-up';
import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:signUp'),
  };
};

const paths = {
  callback: pathsConfig.auth.callback,
  appHome: pathsConfig.app.home,
};

async function SignUpPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Create your account
        </h1>
        <p className="text-gray-500 text-sm">
          Get started with your personal AI assistant
        </p>
      </div>

      {/* Sign up form */}
      <div className="auth-form-clean">
        <SignUpMethodsContainer
          providers={authConfig.providers}
          displayTermsCheckbox={authConfig.displayTermsCheckbox}
          paths={paths}
          captchaSiteKey={authConfig.captchaTokenSiteKey}
        />
      </div>

      {/* Footer link */}
      <div className="text-center pt-2">
        <span className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link 
            href={pathsConfig.auth.signIn} 
            className="text-gray-900 font-medium hover:underline"
          >
            Sign in
          </Link>
        </span>
      </div>
    </div>
  );
}

export default withI18n(SignUpPage);
