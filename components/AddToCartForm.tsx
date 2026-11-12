'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { addToCartAction } from '../app/actions/cart';

export default function AddToCartForm({ productId, stock }: { productId: number; stock: number }) {
  const [state, formAction, pending] = useActionState(addToCartAction, undefined);
  const soldOut = stock === 0;

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="quantity" className="mb-1 block text-sm font-medium">
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={Math.max(stock, 1)}
            defaultValue={1}
            disabled={soldOut}
            className="w-24 rounded-lg border border-line bg-white px-3 py-3 disabled:bg-fog"
          />
        </div>
        <button
          type="submit"
          disabled={soldOut || pending}
          className="rounded-full bg-cobalt px-8 py-3.5 font-semibold text-white transition hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {soldOut ? 'Sold out' : pending ? 'Adding…' : 'Add to cart'}
        </button>
      </div>

      {state?.error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="mt-3 text-sm text-green-800">
          {state.success}{' '}
          <Link href="/cart" className="font-semibold underline">
            View cart
          </Link>
        </p>
      )}
    </form>
  );
}
