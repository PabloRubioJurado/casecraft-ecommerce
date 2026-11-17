import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { formatPrice } from '../../../lib/format';

export const metadata: Metadata = { title: 'Admin · Sales Dashboard' };
export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateInput(raw?: string): Date | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let startDate: Date;
  let endDate: Date;
  let activePreset = '';

  const customFrom = parseDateInput(params.from);
  const customTo = parseDateInput(params.to);

  if (customFrom && customTo && customFrom <= customTo) {
    startDate = customFrom;
    endDate = customTo;
  } else {
    const days = params.range === '7d' ? 7 : params.range === '90d' ? 90 : 30;
    activePreset = `${days}d`;
    endDate = todayUTC;
    startDate = new Date(todayUTC);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  }

  // Fin exclusivo del último día (23:59:59.999)
  const endExclusive = new Date(endDate);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  // Solo contamos pedidos confirmados (Paid, Shipped, Delivered) dentro del rango
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['Paid', 'Shipped', 'Delivered'] },
      createdAt: {
        gte: startDate,
        lt: endExclusive,
      },
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // 1. KPIs globales y Valor Medio del Pedido (AOV)
  const orderCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  // 2. Serie diaria completa entre startDate y endDate
  const dailyMap = new Map<string, { date: string; revenue: number; orders: number }>();
  const cursor = new Date(startDate);
  while (cursor < endExclusive) {
    const key = toISODate(cursor);
    dailyMap.set(key, { date: key, revenue: 0, orders: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const order of orders) {
    const key = toISODate(order.createdAt);
    const entry = dailyMap.get(key);
    if (entry) {
      entry.revenue += Number(order.total);
      entry.orders += 1;
    }
  }

  const dailySeries = Array.from(dailyMap.values());
  const maxDailyRevenue = Math.max(...dailySeries.map((d) => d.revenue), 1);

  // 3. Top 5 productos más vendidos en el intervalo seleccionado
  const productTotals = new Map<
    number,
    { productId: number; name: string; units: number; revenue: number }
  >();

  for (const order of orders) {
    for (const item of order.items) {
      const existing = productTotals.get(item.productId) ?? {
        productId: item.productId,
        name: item.productName,
        units: 0,
        revenue: 0,
      };
      existing.units += item.quantity;
      existing.revenue += Number(item.unitPrice) * item.quantity;
      productTotals.set(item.productId, existing);
    }
  }

  const top5Products = Array.from(productTotals.values())
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, 5);

  const fromStr = toISODate(startDate);
  const toStr = toISODate(endDate);

  return (
    <div className="space-y-8">
      {/* Barra de selección de intervalo de fechas (B4) */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-line sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted">
            Quick range:
          </span>
          {(['7d', '30d', '90d'] as const).map((preset) => (
            <Link
              key={preset}
              href={`/admin/dashboard?range=${preset}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activePreset === preset
                  ? 'bg-ink text-white'
                  : 'border border-line bg-white text-ink hover:border-ink/40'
              }`}
            >
              Last {preset.replace('d', ' days')}
            </Link>
          ))}
        </div>

        <form method="GET" action="/admin/dashboard" className="flex flex-wrap items-end gap-2.5">
          <div>
            <label htmlFor="from" className="block text-xs font-semibold text-muted">
              From
            </label>
            <input
              id="from"
              type="date"
              name="from"
              defaultValue={fromStr}
              className="mt-1 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="to" className="block text-xs font-semibold text-muted">
              To
            </label>
            <input
              id="to"
              type="date"
              name="to"
              defaultValue={toStr}
              className="mt-1 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-cobalt px-4 py-2 text-xs font-semibold text-white transition hover:bg-cobalt-dark sm:text-sm"
          >
            Apply interval
          </button>
        </form>
      </div>

      {/* Tarjetas de métricas: Ingresos, Pedidos y AOV */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Revenue ({fromStr} → {toStr})
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">
            {formatPrice(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-muted">Confirmed paid orders only</p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Completed Orders
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">{orderCount}</p>
          <p className="mt-1 text-xs text-muted">Paid, Shipped &amp; Delivered</p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Average Order Value (AOV)
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-cobalt">
            {formatPrice(averageOrderValue)}
          </p>
          <p className="mt-1 text-xs text-muted">Revenue divided by paid orders</p>
        </div>
      </div>

      {/* Gráfico de ventas diarias + Top 5 productos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico de barras diarias */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Daily Sales</h2>
              <p className="text-xs text-muted">Daily revenue across the selected interval</p>
            </div>
            <span className="text-xs font-medium text-muted">{dailySeries.length} days</span>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex h-52 min-w-[420px] items-end gap-1.5 border-b border-line px-1 pt-6">
              {dailySeries.map((day) => {
                const heightPct = day.revenue > 0 ? Math.max(8, Math.round((day.revenue / maxDailyRevenue) * 100)) : 2;
                return (
                  <div
                    key={day.date}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                    title={`${day.date}: ${formatPrice(day.revenue)} (${day.orders} orders)`}
                  >
                    {day.revenue > 0 && (
                      <span className="mb-1 hidden text-[10px] font-semibold text-ink group-hover:block">
                        {formatPrice(day.revenue)}
                      </span>
                    )}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-8 rounded-t-md transition-all ${
                        day.revenue > 0 ? 'bg-cobalt group-hover:bg-cobalt-dark' : 'bg-fog'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex min-w-[420px] justify-between text-[11px] text-muted">
              <span>{dailySeries[0]?.date}</span>
              <span>{dailySeries[Math.floor(dailySeries.length / 2)]?.date}</span>
              <span>{dailySeries[dailySeries.length - 1]?.date}</span>
            </div>
          </div>
        </div>

        {/* Top 5 productos más vendidos */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-display text-lg font-bold">Top 5 Products</h2>
          <p className="text-xs text-muted">Best sellers by units sold in interval</p>

          {top5Products.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted">
              No confirmed sales in this date range.
            </p>
          ) : (
            <ol className="mt-5 space-y-3.5">
              {top5Products.map((prod, idx) => (
                <li
                  key={prod.productId}
                  className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-fog text-xs font-bold text-ink">
                      {idx + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-ink">{prod.name}</span>
                    <p className="ml-7 text-xs text-muted">{prod.units} units sold</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-ink">
                    {formatPrice(prod.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}