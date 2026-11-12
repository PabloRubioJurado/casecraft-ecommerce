import Link from 'next/link';
import { getCurrentUser } from '../lib/auth';
import { prisma } from '../lib/prisma';
import { logoutAction } from '../app/actions/auth';

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden="true">
      <rect x="5" y="1.5" width="14" height="21" rx="4" fill="#14181f" />
      <rect x="7.5" y="4" width="5.5" height="5.5" rx="1.8" fill="#2d4bf0" />
    </svg>
  );
}

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const cartCount = user
    ? ((await prisma.cartItem.aggregate({ _sum: { quantity: true }, where: { cart: { userId: user.id } } }))._sum.quantity ?? 0)
    : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 font-display text-lg font-extrabold tracking-tight sm:gap-2 sm:text-xl"
        >
          <LogoMark />
          CaseCraft
        </Link>

        <nav className="flex items-center gap-0.5 text-xs font-medium sm:gap-1 sm:text-sm">
          <Link
            href="/products"
            className="rounded-full px-2.5 py-1.5 transition hover:bg-fog sm:px-4 sm:py-2"
          >
            Shop
          </Link>
          <Link
            href="/cart"
            className="flex items-center rounded-full px-2.5 py-1.5 transition hover:bg-fog sm:px-4 sm:py-2"
          >
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="ml-1 rounded-full bg-cobalt px-1.5 py-0.5 text-[11px] leading-none text-white sm:ml-1.5 sm:px-2 sm:text-xs">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link
                href="/account"
                className="rounded-full px-2.5 py-1.5 transition hover:bg-fog sm:px-4 sm:py-2"
              >
                Account
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-white transition hover:bg-cobalt sm:px-4 sm:py-2"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-white transition hover:bg-cobalt sm:px-4 sm:py-2"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}