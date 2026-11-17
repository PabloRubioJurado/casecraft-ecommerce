import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import ProductCard from '../../components/ProductCard';
import { getCategoryMeta } from '../../lib/categories';
import { getCurrentUser } from '../../lib/auth';

export const metadata: Metadata = { title: 'Shop all cases' };

// La página lee de la base de datos en cada petición (búsqueda, filtros, stock, orden).
export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 24;

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
  }>;
}

function parsePositiveNumber(raw?: string): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function normalizeSort(raw?: string): SortOption {
  if (raw === 'price-asc' || raw === 'price-desc' || raw === 'newest') return raw;
  return 'featured';
}

function buildHref({
  page,
  category,
  search,
  minPrice,
  maxPrice,
  inStock,
  sort,
}: {
  page?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: SortOption;
}) {
  const q = new URLSearchParams();
  if (search) q.set('search', search);
  if (category) q.set('category', category);
  if (minPrice !== undefined) q.set('minPrice', String(minPrice));
  if (maxPrice !== undefined) q.set('maxPrice', String(maxPrice));
  if (inStock) q.set('inStock', '1');
  if (sort && sort !== 'featured') q.set('sort', sort);
  if (page && page > 1) q.set('page', String(page));
  const qs = q.toString();
  return qs ? `/products?${qs}` : '/products';
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (user?.role === 'ADMIN') redirect('/admin/products');

  const params = await searchParams;
  const searchQuery = params.search?.trim() || '';
  const categoryName = params.category?.trim() || '';
  const minPrice = parsePositiveNumber(params.minPrice);
  const maxPrice = parsePositiveNumber(params.maxPrice);
  const inStockOnly = params.inStock === '1' || params.inStock === 'true';
  const sort = normalizeSort(params.sort);
  const requestedPage = Number.parseInt(params.page || '1', 10);

  // Filtros combinables en Prisma (B1): nombre, categoría, rango de precios y disponibilidad.
  const priceFilter: Prisma.DecimalFilter | undefined =
    minPrice !== undefined || maxPrice !== undefined
      ? {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        }
      : undefined;

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(searchQuery ? { name: { contains: searchQuery, mode: 'insensitive' } } : {}),
    ...(categoryName ? { category: { name: categoryName } } : {}),
    ...(priceFilter ? { price: priceFilter } : {}),
    ...(inStockOnly ? { stock: { gt: 0 } } : {}),
  };

  // Ordenación por precio o fecha de creación (B1)
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price-asc'
      ? { price: 'asc' }
      : sort === 'price-desc'
        ? { price: 'desc' }
        : sort === 'newest'
          ? { id: 'desc' }
          : { id: 'asc' };

  const [categories, totalProducts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { products: { where: { active: true } } } } },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1), totalPages);

 const productsFromDb = await prisma.product.findMany({
    where,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: {
      category: true,
      reviews: {
        where: { hidden: false },
        select: { rating: true },
      },
    },
    orderBy,
  });

  const products = productsFromDb.map((p) => {
    const reviewCount = p.reviews.length;
    const averageRating =
      reviewCount > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : null;

    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.stock,
      category: p.category.name,
      image: p.image,
      averageRating,
      reviewCount,
    };
  });

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const allCount = categories.reduce((sum, c) => sum + c._count.products, 0);
  const activeMeta = categoryName ? getCategoryMeta(categoryName) : null;
  const hasFilters = Boolean(
    searchQuery ||
      categoryName ||
      minPrice !== undefined ||
      maxPrice !== undefined ||
      inStockOnly ||
      sort !== 'featured'
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
            {categoryName || 'Shop all cases'}
          </h1>
          <p className="mt-1 text-sm text-muted sm:text-base">
            {searchQuery
              ? `${totalProducts} ${totalProducts === 1 ? 'result' : 'results'} for “${searchQuery}”`
              : activeMeta && categoryName === activeMeta.name
                ? activeMeta.blurb
                : `${totalProducts} cases across ${categories.length} materials`}
          </p>
        </div>
      </div>

      {/* Chips de categorías conservando en URL los demás filtros activos */}
      <nav aria-label="Categories" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {[
          { name: '', label: 'All', count: allCount },
          ...categories.map((c) => ({ name: c.name, label: c.name, count: c._count.products })),
        ].map((chip) => {
          const active = chip.name === categoryName;
          return (
            <Link
              key={chip.label}
              href={buildHref({
                category: chip.name,
                search: searchQuery,
                minPrice,
                maxPrice,
                inStock: inStockOnly,
                sort,
              })}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                active ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink/40'
              }`}
            >
              {chip.label}
              <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-muted'}`}>{chip.count}</span>
            </Link>
          );
        })}
      </nav>

      {/* Barra de búsqueda y filtros combinables sincronizados en URL (B1) */}
      <form
        method="GET"
        action="/products"
        role="search"
        className="mt-4 rounded-2xl bg-white p-3.5 ring-1 ring-line sm:p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          {/* Búsqueda por nombre */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="search" className="block text-xs font-semibold text-muted">
              Search
            </label>
            <input
              id="search"
              type="search"
              name="search"
              defaultValue={searchQuery}
              placeholder="Case name..."
              className="mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm"
            />
          </div>

          {/* Filtro por categoría */}
          <div className="lg:col-span-3">
            <label htmlFor="category" className="block text-xs font-semibold text-muted">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={categoryName}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="">All materials</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de precios */}
          <div className="grid grid-cols-2 gap-2 lg:col-span-3">
            <div>
              <label htmlFor="minPrice" className="block text-xs font-semibold text-muted">
                Min (€)
              </label>
              <input
                id="minPrice"
                type="number"
                name="minPrice"
                min="0"
                step="0.01"
                defaultValue={minPrice ?? ''}
                placeholder="0"
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className="block text-xs font-semibold text-muted">
                Max (€)
              </label>
              <input
                id="maxPrice"
                type="number"
                name="maxPrice"
                min="0"
                step="0.01"
                defaultValue={maxPrice ?? ''}
                placeholder="150"
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Ordenación */}
          <div className="lg:col-span-2">
            <label htmlFor="sort" className="block text-xs font-semibold text-muted">
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sort}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest arrivals</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="inStock"
              value="1"
              defaultChecked={inStockOnly}
              className="h-4 w-4 rounded border-line text-cobalt focus:ring-cobalt"
            />
            In stock only
          </label>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <Link
                href="/products"
                className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:border-ink/40 hover:text-ink sm:text-sm"
              >
                Reset
              </Link>
            )}
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white transition hover:bg-cobalt sm:text-sm"
            >
              Apply filters
            </button>
          </div>
        </div>
      </form>

      {products.length > 0 ? (
        <>
          <p className="mt-6 text-sm text-muted">
            Showing {startIndex + 1}–{startIndex + products.length} of {totalProducts}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-line">
          <p className="font-display text-xl font-bold">No cases match your filters</p>
          <p className="mt-1 text-muted">Try adjusting the price range, material, or search term.</p>
          {hasFilters && (
            <Link
              href="/products"
              className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt"
            >
              Clear all filters
            </Link>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
          {currentPage > 1 ? (
            <Link
              href={buildHref({
                page: currentPage - 1,
                category: categoryName,
                search: searchQuery,
                minPrice,
                maxPrice,
                inStock: inStockOnly,
                sort,
              })}
              className="rounded-full border border-line bg-white px-4 py-2 transition hover:border-ink/40"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-full border border-line px-4 py-2 text-muted/50">Previous</span>
          )}

          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNumber = i + 1;
            const active = pageNumber === currentPage;
            return (
              <Link
                key={pageNumber}
                href={buildHref({
                  page: pageNumber,
                  category: categoryName,
                  search: searchQuery,
                  minPrice,
                  maxPrice,
                  inStock: inStockOnly,
                  sort,
                })}
                aria-current={active ? 'page' : undefined}
                className={`min-w-10 rounded-full px-3.5 py-2 text-center transition ${
                  active ? 'bg-ink text-white' : 'border border-line bg-white hover:border-ink/40'
                }`}
              >
                {pageNumber}
              </Link>
            );
          })}

          {currentPage < totalPages ? (
            <Link
              href={buildHref({
                page: currentPage + 1,
                category: categoryName,
                search: searchQuery,
                minPrice,
                maxPrice,
                inStock: inStockOnly,
                sort,
              })}
              className="rounded-full border border-line bg-white px-4 py-2 transition hover:border-ink/40"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-full border border-line px-4 py-2 text-muted/50">Next</span>
          )}
        </nav>
      )}
    </div>
  );
}