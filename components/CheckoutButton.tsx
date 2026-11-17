'use client';

import Link from 'next/link';

export default function CheckoutButton() {
  return (
    <Link
      href="/checkout"
      className="mt-6 block w-full rounded-full bg-ink px-6 py-3.5 text-center font-semibold text-white transition hover:bg-cobalt"
    >
      Proceed to Checkout
    </Link>
  );
}