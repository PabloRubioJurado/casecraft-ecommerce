import Link from 'next/link';
import { prisma } from '../../lib/prisma';
import ProductCard from '../../components/ProductCard';

const ITEMS_PER_PAGE = 24;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.search?.trim() || '';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));

  // Filtro por nombre sensible a mayúsculas/minúsculas para PostgreSQL (Requisito A2)
  const whereClause = searchQuery
    ? {
        name: {
          contains: searchQuery,
          mode: 'insensitive' as const,
        },
      }
    : {};

  // 1. Consulta el total de productos filtrados directamente en PostgreSQL
  const totalProducts = await prisma.product.count({ where: whereClause });
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE) || 1;

  // 2. Consulta los productos de la página actual desde PostgreSQL con Prisma (Requisito A1)
  const productsFromDb = await prisma.product.findMany({
    where: whereClause,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });

  // Mapeo ligero de los datos leídos de la BD
  const products = productsFromDb.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    category: p.category.name,
    image: p.image,
  }));

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + products.length;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Encabezado y buscador */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smartphone Cases Catalog</h1>
          <p className="text-gray-600 mt-1">
            {searchQuery
              ? `Search results for "${searchQuery}" (${totalProducts} products found)`
              : `Showing products ${totalProducts > 0 ? startIndex + 1 : 0}–${endIndex} of ${totalProducts}`}
          </p>
        </div>

        <form method="GET" action="/products" className="flex items-center gap-2">
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search by product name..."
            className="px-4 py-2 border rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
          >
            Search
          </button>
          {searchQuery && (
            <Link
              href="/products"
              className="px-3 py-2 border text-sm text-gray-600 rounded-md hover:bg-gray-100 transition"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Grid de productos o aviso de "Sin resultados" */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg bg-gray-50">
          <p className="text-lg font-medium text-gray-600">No products found matching "{searchQuery}"</p>
          <Link
            href="/products"
            className="inline-block mt-4 text-sm font-semibold text-black underline hover:text-gray-700"
          >
            Back to full catalog
          </Link>
        </div>
      )}

      {/* Paginación dinámica */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {currentPage > 1 ? (
            <Link
              href={`/products?page=${currentPage - 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
              className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              ← Previous
            </Link>
          ) : (
            <span className="px-4 py-2 border rounded-md text-sm font-medium text-gray-300 bg-gray-50 cursor-not-allowed">
              ← Previous
            </span>
          )}

          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNumber = i + 1;
            const isActive = pageNumber === currentPage;

            return (
              <Link
                key={pageNumber}
                href={`/products?page=${pageNumber}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                className={`px-3.5 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? 'bg-black text-white'
                    : 'bg-white border text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </Link>
            );
          })}

          {currentPage < totalPages ? (
            <Link
              href={`/products?page=${currentPage + 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
              className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              Next →
            </Link>
          ) : (
            <span className="px-4 py-2 border rounded-md text-sm font-medium text-gray-300 bg-gray-50 cursor-not-allowed">
              Next →
            </span>
          )}
        </div>
      )}
    </main>
  );
}