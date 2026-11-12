import type { Metadata } from 'next';
import { prisma } from '../../lib/prisma';
import { requireUser } from '../../lib/auth';
import { countryName } from '../../lib/validation';
import { logoutAction } from '../actions/auth';
import { deleteAddressAction, setDefaultAddressAction } from '../actions/account';
import AddressForm from './AddressForm';

export const metadata: Metadata = { title: 'Your account' };

export default async function AccountPage() {
  const user = await requireUser('/account');
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Your account</h1>
          <p className="mt-1 text-muted">
            {user.name ? `${user.name} · ` : ''}
            {user.email}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-ink/40"
          >
            Sign out
          </button>
        </form>
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Delivery addresses</h2>
      {addresses.length === 0 ? (
        <p className="mt-2 text-muted">You haven’t saved an address yet. Add one below to speed up checkout.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-line">
              {a.isDefault && (
                <span className="mb-2 w-fit rounded-full bg-fog px-2.5 py-1 text-xs font-medium">Default</span>
              )}
              <p className="font-semibold">{a.fullName}</p>
              <p className="text-sm text-muted">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.postalCode} {a.city}
                <br />
                {countryName(a.country)}
                {a.phone ? ` · ${a.phone}` : ''}
              </p>
              <div className="mt-4 flex gap-2 text-sm font-medium">
                {!a.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="rounded-full border border-line px-3 py-1.5 hover:border-ink/40">
                      Make default
                    </button>
                  </form>
                )}
                <form action={deleteAddressAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="rounded-full border border-line px-3 py-1.5 text-red-600 hover:border-red-300">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-4 mt-10 font-display text-xl font-bold">Add an address</h2>
      <AddressForm />
    </div>
  );
}
