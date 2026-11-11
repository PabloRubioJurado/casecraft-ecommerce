import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  // Consulta directa a PostgreSQL para obtener el producto y su categoría
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Botón de volver al catálogo */}
      <div className="mb-6">
        <Link
          href="/products"
          className="text-sm font-medium text-gray-600 hover:text-black transition flex items-center gap-1"
        >
          ← Back to Catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Placeholder de Imagen */}
        <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center border shadow-inner">
          <span className="text-gray-400 font-medium text-lg">{product.name}</span>
        </div>

        {/* Información del producto */}
        <div className="flex flex-col justify-between h-full">
          <div>
            <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider mb-3">
              {product.category.name}
            </span>

            <h1 className="text-3xl font-extrabold text-gray-900">{product.name}</h1>

            <p className="text-3xl font-bold text-gray-900 mt-4">${product.price.toFixed(2)}</p>

            <div className="mt-6 border-t border-b border-gray-100 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>

            <div className="mt-6">
              <span className="text-xs font-semibold uppercase text-gray-500 block mb-1">
                Stock Availability
              </span>
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-gray-900">
                    In Stock ({product.stock} units available)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-sm font-medium text-red-600">Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <button className="w-full bg-black text-white font-medium py-3.5 px-6 rounded-lg shadow hover:bg-gray-800 transition flex items-center justify-center gap-2">
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}