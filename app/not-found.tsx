import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">That page isn’t in the store</h1>
      <p className="mt-2 text-muted">The case may have been removed, or the link is wrong.</p>
      <Link
        href="/products"
        className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-white transition hover:bg-cobalt"
      >
        Browse all cases
      </Link>
    </div>
  );
}
