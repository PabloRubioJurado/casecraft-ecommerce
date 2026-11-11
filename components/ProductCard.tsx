import Link from 'next/link';
import { Product } from '../types/product';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between bg-white">
      <div>
        <div className="w-full h-48 bg-gray-100 rounded-md mb-4 flex items-center justify-center text-gray-500 font-semibold">
          <span>{product.name}</span>
        </div>
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
          {product.category}
        </span>
        <h3 className="text-lg font-bold mt-1 text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">{product.price.toFixed(2)} €</span>
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