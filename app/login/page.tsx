import Link from 'next/link';

export default async function ProfilePage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Mi Cuenta (A4 - User Accounts)</h1>
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <p className="text-gray-700 mb-2"><strong>Estado:</strong> Autenticado</p>
        <p className="text-gray-700 mb-4"><strong>Dirección de entrega guardada:</strong> Calle Principal 123, Madrid</p>
        
        <div className="mt-6 flex flex-wrap gap-4">
          <button type="button" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
            Actualizar Dirección
          </button>
          
          {/* Botón para navegar a la primera página del Catálogo */}
          <Link 
            href="/products" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center"
          >
            Ir al Catálogo
          </Link>

          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}