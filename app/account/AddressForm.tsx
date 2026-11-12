'use client';

import { useActionState } from 'react';
import FormField from '../../components/FormField';
import { addAddressAction } from '../actions/account';
import { COUNTRIES } from '../../lib/validation';

export default function AddressForm() {
  const [state, formAction, pending] = useActionState(addAddressAction, undefined);
  const errors = state?.fieldErrors ?? {};
  const values = state?.values ?? {};

  return (
    <form action={formAction} className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-line sm:p-6">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {state.success}
        </p>
      )}
      <FormField label="Full name" name="fullName" autoComplete="name" required defaultValue={values.fullName} error={errors.fullName} />
      <FormField label="Street and number" name="line1" autoComplete="address-line1" required defaultValue={values.line1} error={errors.line1} />
      <FormField label="Apartment, floor (optional)" name="line2" autoComplete="address-line2" defaultValue={values.line2} error={errors.line2} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="City" name="city" autoComplete="address-level2" required defaultValue={values.city} error={errors.city} />
        <FormField label="Postal code" name="postalCode" autoComplete="postal-code" required defaultValue={values.postalCode} error={errors.postalCode} />
      </div>
      <div>
        <label htmlFor="country" className="mb-1 block text-sm font-medium">
          Country
        </label>
        <select
          id="country"
          name="country"
          defaultValue={values.country || 'ES'}
          autoComplete="country"
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base sm:text-sm"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.country && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.country}
          </p>
        )}
      </div>
      <FormField label="Phone (optional)" name="phone" type="tel" autoComplete="tel" defaultValue={values.phone} error={errors.phone} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink px-6 py-3 font-semibold text-white transition hover:bg-cobalt disabled:opacity-60 sm:w-auto"
      >
        {pending ? 'Saving…' : 'Save address'}
      </button>
    </form>
  );
}