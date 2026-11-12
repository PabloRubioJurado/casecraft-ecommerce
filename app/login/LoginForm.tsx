'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import FormField from '../../components/FormField';
import { loginAction } from '../actions/auth';

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="mt-8 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line">
      <input type="hidden" name="next" value={next} />
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <FormField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} />
      <FormField label="Password" name="password" type="password" autoComplete="current-password" required />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-cobalt px-6 py-3 font-semibold text-white transition hover:bg-cobalt-dark disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-muted">
        New here?{' '}
        <Link href="/register" className="font-semibold text-ink underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
