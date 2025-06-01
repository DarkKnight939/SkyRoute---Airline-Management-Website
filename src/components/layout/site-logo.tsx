import Link from 'next/link';
import { Plane } from 'lucide-react';

interface SiteLogoProps {
  className?: string;
  skipLink?: boolean;
}

export function SiteLogo({ className = '', skipLink = false }: SiteLogoProps) {
  const content = (
    <>
      <Plane className="h-6 w-6" />
      <span className="font-bold">SkyRoutes</span>
    </>
  );

  if (skipLink) {
    return <div className={`flex items-center gap-2 ${className}`}>{content}</div>;
  }

  return (
    <Link href="/" className={`flex items-center gap-2 text-primary hover:text-primary/90 transition-colors ${className}`}>
      {content}
    </Link>
  );
}
