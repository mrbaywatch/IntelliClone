import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 180,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <Image
      src="/images/intelliclone-logo.png"
      alt="IntelliClone"
      width={width}
      height={Math.round(width * 0.27)} // Maintain aspect ratio
      className={cn('h-auto', className)}
      priority
    />
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
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'} prefetch={true}>
      <LogoImage className={className} />
    </Link>
  );
}
