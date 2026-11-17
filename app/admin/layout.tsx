import Link from 'next/link';
import { requireAdmin } from '../../lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <span className="inline-block rounded-full bg-ink px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">
            Admin Panel
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Store Management
          </h1>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link
            href="/admin/dashboard"
            className="rounded-full border border-line bg-white px-4 py-2 text-gray-900 transition hover:bg-fog"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-full border border-line bg-white px-4 py-2 text-gray-900 transition hover:bg-fog"
          >
            Orders
          </Link>
          <Link
            href="/admin/products"
            className="rounded-full border border-line bg-white px-4 py-2 text-gray-900 transition hover:bg-fog"
          >
            Products
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-full border border-line bg-white px-4 py-2 text-gray-900 transition hover:bg-fog"
          >
            Categories
          </Link>
          <Link
            href="/admin/discounts"
            className="rounded-full border border-line bg-white px-4 py-2 text-gray-900 transition hover:bg-fog"
          >
            Discounts
          </Link>
          <Link
            href="/admin/reviews"
            className="rounded-full border border-line bg-white px-4 py-2 text-gray-900 transition hover:bg-fog"
          >
            Reviews
          </Link>
          <span className="ml-2 hidden text-xs font-normal text-muted sm:inline">
            Signed in as {admin.email}
          </span>
        </nav>
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}