import { AppLogo } from '~/components/app-logo';

function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#fdfcfb] to-[#f5f3ef] p-4">
      <div className="mb-8">
        <AppLogo href="/" />
      </div>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
