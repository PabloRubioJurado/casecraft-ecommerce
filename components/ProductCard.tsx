import Link from 'next/link';

export default function ProductCard({ product }: { product: any }) {
  // Solución al crash: Convertimos el Decimal de Prisma a número nativo de forma segura
  const safePrice = Number(product.price).toFixed(2);

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between bg-white h-full">
      <div>
        {/* Placeholder de imagen de Darío */}
        <div className="w-full h-48 bg-gray-100 rounded-md mb-4 flex items-center justify-center text-gray-500 font-semibold text-center px-4">
          <span>{product.name}</span>
        </div>
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
          {product.category}
        </span>
        <h3 className="text-lg font-bold mt-1 text-gray-900 leading-tight">{product.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mt-2">{product.description}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xl font-bold text-gray-900">{safePrice} €</span>
        <Link 
          href={`/products/${product.id}`}
          className="px-3 py-1.5 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  );
}