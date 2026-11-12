import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '../../lib/auth';
import { safeRedirectPath } from '../../lib/validation';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next);

  if (await getCurrentUser()) redirect(safeNext);

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Sign in</h1>
      <p className="mt-2 text-muted">Welcome back. Your cart and addresses are waiting.</p>
      <LoginForm next={safeNext} />
    </div>
  );
}
