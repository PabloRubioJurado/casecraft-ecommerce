import Link from 'next/link';

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <rect x="5" y="1.5" width="14" height="21" rx="4" fill="#14181f" />
      <rect x="7.5" y="4" width="5.5" height="5.5" rx="1.8" fill="#2d4bf0" />
    </svg>
  );
}

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
          <LogoMark />
          CaseCraft
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link href="/products" className="rounded-full px-4 py-2 transition hover:bg-fog">
            Shop
          </Link>
          <Link href="/login" className="rounded-full bg-ink px-4 py-2 text-white transition hover:bg-cobalt">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
