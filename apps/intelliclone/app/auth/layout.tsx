function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#fdfcfb] to-[#f5f3ef] p-4">
      {/* Logo */}
      <div className="mb-10">
        <a href="/" className="text-3xl font-semibold tracking-tight">
          <span className="text-gray-900">Intelli</span>
          <span style={{ color: '#D4A84B' }}>Clone</span>
        </a>
      </div>
      
      {/* Card */}
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
          {children}
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 IntelliClone. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
