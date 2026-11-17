import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '../../lib/auth';
import { safeRedirectPath } from '../../lib/validation';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next);

  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'ADMIN' ? '/admin' : safeNext);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Sign in</h1>
      <p className="mt-2 text-sm text-muted sm:text-base">Welcome back. Your cart and addresses are waiting.</p>
      <LoginForm next={safeNext} />
    </div>
  );
}