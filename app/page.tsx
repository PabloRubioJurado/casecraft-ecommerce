import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Bienvenido a CaseCraft</h1>
      <p className="text-lg text-gray-600 mb-8">
        Tu tienda de fundas y accesorios para smartphone.
      </p>

      <div className="flex gap-4">
        {/* Enlace al Catálogo */}
        <Link 
          href="/products" 
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Ver Catálogo
        </Link>

        {/* Enlace a Iniciar Sesión / Mi Cuenta */}
        <Link 
          href="/login" 
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
        >
          Iniciar Sesión
        </Link>
      </div>
    </main>
  );
}