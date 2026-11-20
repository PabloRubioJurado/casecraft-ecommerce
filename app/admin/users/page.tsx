import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

const ACTIVE_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: [{ lastActiveAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      lastActiveAt: true,
      _count: {
        select: { orders: true },
      },
    },
  });

  const now = Date.now();
  const activeUsers = users.filter(
    (u) => u.lastActiveAt && now - new Date(u.lastActiveAt).getTime() <= ACTIVE_WINDOW_MS
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cuentas y usuarios activos
          </h1>
          <p className="text-sm text-slate-600">
            Cuentas registradas en la tienda y sesiones activas en los últimos 15 minutos.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
            <p className="text-xs text-slate-500">Total cuentas</p>
            <p className="text-lg font-bold text-slate-900">{users.length}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-right shadow-sm">
            <p className="text-xs text-emerald-700">Activas ahora</p>
            <p className="text-lg font-bold text-emerald-700">{activeUsers.length}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Última actividad</th>
              <th className="px-4 py-3">Fecha de registro</th>
              <th className="px-4 py-3 text-right">Pedidos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isActive =
                u.lastActiveAt !== null &&
                now - new Date(u.lastActiveAt).getTime() <= ACTIVE_WINDOW_MS;

              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        String(u.role).toUpperCase() === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {String(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Activa ahora
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.lastActiveAt
                      ? new Date(u.lastActiveAt).toLocaleString('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : 'Sin actividad reciente'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(u.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {u._count.orders}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}