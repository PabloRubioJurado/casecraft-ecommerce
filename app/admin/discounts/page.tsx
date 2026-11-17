import type { Metadata } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { formatPrice } from '../../../lib/format';
import { createDiscountAction, toggleDiscountActiveAction } from '../../actions/discounts';

export const metadata: Metadata = { title: 'Admin · Discount Codes' };
export const dynamic = 'force-dynamic';

export default async function AdminDiscountsPage() {
  await requireAdmin();

  const discounts = await prisma.discountCode.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();

  return (
    <div className="space-y-8">
      {/* Formulario para crear un cupón (B5) */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="font-display text-xl font-bold">Create Discount Code</h2>
        <p className="mt-1 text-sm text-muted">
          Configure percentage or fixed-amount promotions with optional expiration and usage limits.
        </p>

        <form action={createDiscountAction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div>
            <label htmlFor="code" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Code *
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              placeholder="WELCOME15"
              className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm uppercase"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Type *
            </label>
            <select
              id="type"
              name="type"
              defaultValue="PERCENTAGE"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed amount (€)</option>
            </select>
          </div>

          <div>
            <label htmlFor="value" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Value *
            </label>
            <input
              id="value"
              name="value"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="15"
              className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="expiresAt" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Expiry date
            </label>
            <input
              id="expiresAt"
              name="expiresAt"
              type="date"
              className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="maxUses" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Max uses
            </label>
            <input
              id="maxUses"
              name="maxUses"
              type="number"
              min="1"
              step="1"
              placeholder="Unlimited"
              className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              className="rounded-full bg-cobalt px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
            >
              Save discount code
            </button>
          </div>
        </form>
      </section>

      {/* Listado de cupones existentes */}
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold">Configured Codes ({discounts.length})</h2>
        </div>

        {discounts.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted">
            No discount codes created yet. Create one above to test promotional pricing at checkout.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-fog/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Discount</th>
                  <th className="px-6 py-3">Usage</th>
                  <th className="px-6 py-3">Expires</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {discounts.map((d) => {
                  const isExpired = Boolean(d.expiresAt && d.expiresAt < now);
                  const isExhausted = d.maxUses !== null && d.usedCount >= d.maxUses;
                  const usable = d.active && !isExpired && !isExhausted;

                  return (
                    <tr key={d.id}>
                      <td className="px-6 py-4 font-mono font-bold text-ink">{d.code}</td>
                      <td className="px-6 py-4 font-semibold">
                        {d.type === 'PERCENTAGE' ? `${Number(d.value)}% off` : `${formatPrice(Number(d.value))} off`}
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {d.usedCount} / {d.maxUses ?? '∞'}
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {d.expiresAt ? d.expiresAt.toISOString().slice(0, 10) : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            usable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {!d.active
                            ? 'Disabled'
                            : isExpired
                              ? 'Expired'
                              : isExhausted
                                ? 'Max uses reached'
                                : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <form action={toggleDiscountActiveAction}>
                          <input type="hidden" name="id" value={d.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold transition hover:border-ink/40"
                          >
                            {d.active ? 'Disable' : 'Enable'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}