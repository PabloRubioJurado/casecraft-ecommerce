'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import FormField from '../../components/FormField';
import { registerAction } from '../actions/auth';

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-2xl bg-white p-4 ring-1 ring-line sm:mt-8 sm:p-6">
      <FormField label="Name (optional)" name="name" autoComplete="name" maxLength={80} defaultValue={state?.values?.name} error={errors.name} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} error={errors.email} />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        error={errors.password}
      />
      <FormField label="Repeat password" name="confirm" type="password" autoComplete="new-password" required error={errors.confirm} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-cobalt px-6 py-3 font-semibold text-white transition hover:bg-cobalt-dark disabled:opacity-60"
      >
        {pending ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-ink underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}