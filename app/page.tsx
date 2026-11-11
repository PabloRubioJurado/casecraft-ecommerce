import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
        Welcome to CaseCraft
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-md">
        Discover our premium selection of smartphone cases designed for ultimate protection and style.
      </p>
      <div className="mt-8">
        <Link
          href="/products"
          className="px-6 py-3 bg-black text-white font-medium rounded-lg shadow hover:bg-gray-800 transition"
        >
          Explore Catalog →
        </Link>
      </div>
    </main>
  );
}