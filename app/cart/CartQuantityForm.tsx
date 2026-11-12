'use client';

import { useActionState } from 'react';
import { updateCartItemAction } from '../actions/cart';

export default function CartQuantityForm({
  productId,
  quantity,
  stock,
}: {
  productId: number;
  quantity: number;
  stock: number;
}) {
  const [state, formAction, pending] = useActionState(updateCartItemAction, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`qty-${productId}`} className="sr-only">
          Quantity
        </label>
        <input
          id={`qty-${productId}`}
          name="quantity"
          type="number"
          min={1}
          max={Math.max(stock, 1)}
          defaultValue={quantity}
          className="w-16 rounded-lg border border-line bg-white px-2.5 py-1.5 text-base sm:w-20 sm:px-3 sm:py-2 sm:text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-line px-3 py-1.5 text-xs font-medium transition hover:border-ink/40 disabled:opacity-60 sm:px-3.5 sm:py-2 sm:text-sm"
        >
          {pending ? 'Updating…' : 'Update'}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="mt-1 text-xs text-red-600 sm:text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}