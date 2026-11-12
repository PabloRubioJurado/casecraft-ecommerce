import Link from 'next/link';
import CaseArt from './CaseArt';
import { getCategoryMeta } from '../lib/categories';
import { formatPrice } from '../lib/format';
import type { ProductCardData } from '../types/product';

export default function ProductCard({ product }: { product: ProductCardData }) {
  const meta = getCategoryMeta(product.category);
  const soldOut = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line transition hover:ring-ink/30"
    >
      <div className="relative aspect-[4/5]" style={{ background: meta.tint }}>
        <CaseArt
          kind={meta.key}
          seed={product.id}
          className="absolute inset-[9%] transition-transform duration-300 group-hover:-translate-y-1"
        />
        {(soldOut || lowStock) && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
            {soldOut ? 'Sold out' : `Only ${product.stock} left`}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <span className="truncate text-[11px] text-muted sm:text-xs">{product.category}</span>
        <h3 className="font-display text-sm font-bold leading-snug sm:text-base">{product.name}</h3>
        <p className="mt-auto pt-2 text-base font-bold sm:pt-3 sm:text-lg">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}