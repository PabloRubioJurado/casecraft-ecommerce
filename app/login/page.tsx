import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in' };

// TODO (A4): conectar con el registro/login real (Argon2/bcrypt + sesión).
// Hasta entonces el formulario queda desactivado para no simular un login que no existe.
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Sign in</h1>
      <p className="mt-2 text-muted">Accounts are coming soon. You can still browse the full catalog.</p>

      <form className="mt-8 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        <fieldset disabled className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input id="email" type="email" className="w-full rounded-lg border border-line bg-fog px-3 py-2.5" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input id="password" type="password" className="w-full rounded-lg border border-line bg-fog px-3 py-2.5" />
          </div>
          <button
            type="button"
            className="w-full rounded-full bg-line px-6 py-3 font-semibold text-muted"
          >
            Sign in
          </button>
        </fieldset>
      </form>

      <Link
        href="/products"
        className="mt-6 inline-block rounded-full bg-cobalt px-6 py-3 font-semibold text-white transition hover:bg-cobalt-dark"
      >
        Browse all cases
      </Link>
    </div>
  );
}
