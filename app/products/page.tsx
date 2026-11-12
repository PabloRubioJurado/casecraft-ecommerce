import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '../../lib/prisma';
import ProductCard from '../../components/ProductCard';
import { getCategoryMeta } from '../../lib/categories';

export const metadata: Metadata = { title: 'Shop all cases' };

// La página lee de la base de datos en cada petición (búsqueda, filtros, stock).
export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 24;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; category?: string }>;
}

function buildHref({ page, category, search }: { page?: number; category?: string; search?: string }) {
  const q = new URLSearchParams();
  if (search) q.set('search', search);
  if (category) q.set('category', category);
  if (page && page > 1) q.set('page', String(page));
  const qs = q.toString();
  return qs ? `/products?${qs}` : '/products';
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.search?.trim() || '';
  const categoryName = params.category?.trim() || '';
  const requestedPage = Number.parseInt(params.page || '1', 10);

  // Filtro por nombre (A2) y por categoría; ambos con Prisma, sin SQL manual.
  const where = {
    ...(searchQuery ? { name: { contains: searchQuery, mode: 'insensitive' as const } } : {}),
    ...(categoryName ? { category: { name: categoryName } } : {}),
  };

  const [categories, totalProducts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1), totalPages);

  const productsFromDb = await prisma.product.findMany({
    where,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: { category: true },
    orderBy: { id: 'asc' },
  });

  const products = productsFromDb.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    category: p.category.name,
  }));

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const allCount = categories.reduce((sum, c) => sum + c._count.products, 0);
  const activeMeta = categoryName ? getCategoryMeta(categoryName) : null;
  const hasFilters = Boolean(searchQuery || categoryName);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {categoryName || 'Shop all cases'}
          </h1>
          <p className="mt-1 text-muted">
            {searchQuery
              ? `${totalProducts} ${totalProducts === 1 ? 'result' : 'results'} for “${searchQuery}”`
              : activeMeta && categoryName === activeMeta.name
                ? activeMeta.blurb
                : `${totalProducts} cases across ${categories.length} materials`}
          </p>
        </div>

        <form method="GET" action="/products" role="search" className="flex w-full items-center gap-2 md:w-auto">
          {categoryName && <input type="hidden" name="category" value={categoryName} />}
          <label htmlFor="search" className="sr-only">
            Search by product name
          </label>
          <input
            id="search"
            type="search"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search by name"
            className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm md:w-64 md:flex-none"
          />
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt"
          >
            Search
          </button>
        </form>
      </div>

      <nav aria-label="Categories" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ name: '', label: 'All', count: allCount }, ...categories.map((c) => ({ name: c.name, label: c.name, count: c._count.products }))].map(
          (chip) => {
            const active = chip.name === categoryName;
            return (
              <Link
                key={chip.label}
                href={buildHref({ category: chip.name, search: searchQuery })}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink/40'
                }`}
              >
                {chip.label}
                <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-muted'}`}>{chip.count}</span>
              </Link>
            );
          },
        )}
      </nav>

      {products.length > 0 ? (
        <>
          <p className="mt-6 text-sm text-muted">
            Showing {startIndex + 1}–{startIndex + products.length} of {totalProducts}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-line">
          <p className="font-display text-xl font-bold">No cases match your search</p>
          <p className="mt-1 text-muted">Try a shorter name or another material.</p>
          {hasFilters && (
            <Link
              href="/products"
              className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt"
            >
              Clear filters
            </Link>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
          {currentPage > 1 ? (
            <Link
              href={buildHref({ page: currentPage - 1, category: categoryName, search: searchQuery })}
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
                href={buildHref({ page: pageNumber, category: categoryName, search: searchQuery })}
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
              href={buildHref({ page: currentPage + 1, category: categoryName, search: searchQuery })}
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
