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
      <div className="flex items-center gap-2">
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
          className="w-20 rounded-lg border border-line bg-white px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-line px-3.5 py-2 text-sm font-medium transition hover:border-ink/40 disabled:opacity-60"
        >
          {pending ? 'Updating…' : 'Update'}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
