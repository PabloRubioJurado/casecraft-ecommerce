import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '../../lib/auth';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = { title: 'Create account' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/account');

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-2 text-muted">Save your delivery addresses and keep your cart between visits.</p>
      <RegisterForm />
    </div>
  );
}
