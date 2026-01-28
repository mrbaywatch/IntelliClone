import Link from 'next/link';

import { cn } from '@kit/ui/utils';

function LogoContent({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* DNA Helix Icon */}
      <svg
        className="h-8 w-8"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 4C14 4 9 8 9 14C9 20 14 24 20 24C26 24 31 20 31 14"
          stroke="#D4A84B"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M20 36C26 36 31 32 31 26C31 20 26 16 20 16C14 16 9 20 9 26"
          stroke="#D4A84B"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="12" cy="14" r="2" fill="#D4A84B" />
        <circle cx="28" cy="14" r="2" fill="#D4A84B" />
        <circle cx="12" cy="26" r="2" fill="#D4A84B" />
        <circle cx="28" cy="26" r="2" fill="#D4A84B" />
      </svg>
      {/* Text Logo */}
      <span className="text-xl font-semibold">
        <span className="text-gray-900 dark:text-gray-100">Intelli</span>
        <span style={{ color: '#D4A84B' }}>Clone</span>
      </span>
    </div>
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoContent className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'} prefetch={true}>
      <LogoContent className={className} />
    </Link>
  );
}
