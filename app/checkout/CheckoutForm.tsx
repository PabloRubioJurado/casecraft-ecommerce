'use client';

import { useState } from 'react';
import { formatPrice } from '../../lib/format';
import { getCategoryMeta } from '../../lib/categories';
import CaseArt from '../../components/CaseArt';

interface SavedAddress {
  id: number;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

interface CheckoutItem {
  id: number;
  productId: number;
  name: string;
  categoryName: string;
  price: number;
  quantity: number;
}

interface CheckoutFormProps {
  addresses: SavedAddress[];
  items: CheckoutItem[];
  defaultName: string;
}

const SHIPPING_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: '3–5 business days · Tracked parcel',
    cost: 3.99,
  },
  {
    id: 'express',
    name: 'Express Courier',
    description: '24–48 hours · Priority handling',
    cost: 8.99,
  },
] as const;

export default function CheckoutForm({ addresses, items, defaultName }: CheckoutFormProps) {
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];

  const [addressMode, setAddressMode] = useState<'saved' | 'new'>(
    addresses.length > 0 ? 'saved' : 'new'
  );
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    defaultAddr ? defaultAddr.id : null
  );

  // Campos para dirección nueva
  const [fullName, setFullName] = useState(defaultName);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('ES');
  const [phone, setPhone] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);

  // Método de envío
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // Código promocional (B5)
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedShipping =
    SHIPPING_OPTIONS.find((opt) => opt.id === shippingMethod) ?? SHIPPING_OPTIONS[0];

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const total = Math.max(0.5, subtotal - discountAmount + selectedShipping.cost);

  async function handleApplyPromo() {
    setPromoError(null);
    if (!promoInput.trim()) return;

    setPromoLoading(true);
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppliedPromo(null);
        setPromoError(data.error || 'Invalid discount code');
      } else {
        setAppliedPromo({ code: data.code, discountAmount: data.discountAmount });
      }
    } catch {
      setPromoError('Could not validate code');
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload =
        addressMode === 'saved' && selectedAddressId
          ? {
              addressId: selectedAddressId,
              shippingMethod,
              discountCode: appliedPromo?.code || undefined,
            }
          : {
              newAddress: {
                fullName,
                line1,
                line2,
                city,
                postalCode,
                country,
                phone,
                save: saveAddress,
              },
              shippingMethod,
              discountCode: appliedPromo?.code || undefined,
            };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not start checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-12">
      {/* Columna izquierda: Paso 1 (Dirección) y Paso 2 (Método de envío) */}
      <div className="space-y-8 lg:col-span-7">
        {/* PASO 1: DIRECCIÓN DE ENTREGA */}
        <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
              1
            </span>
            <h2 className="font-display text-xl font-bold">Delivery address</h2>
          </div>

          {addresses.length > 0 && (
            <div className="mt-5 space-y-3">
              {addresses.map((addr) => {
                const isSelected = addressMode === 'saved' && selectedAddressId === addr.id;
                return (
                  <label
                    key={addr.id}
                    onClick={() => {
                      setAddressMode('saved');
                      setSelectedAddressId(addr.id);
                    }}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      isSelected
                        ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt'
                        : 'border-line hover:bg-fog/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="addressChoice"
                      checked={isSelected}
                      onChange={() => {
                        setAddressMode('saved');
                        setSelectedAddressId(addr.id);
                      }}
                      className="mt-1 accent-cobalt"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">
                        {addr.fullName}{' '}
                        {addr.isDefault && (
                          <span className="ml-2 rounded-full bg-fog px-2 py-0.5 text-xs font-medium text-muted">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-muted">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}
                      </p>
                      <p className="text-muted">
                        {addr.postalCode} {addr.city}, {addr.country}
                      </p>
                    </div>
                  </label>
                );
              })}

              <button
                type="button"
                onClick={() => setAddressMode(addressMode === 'new' ? 'saved' : 'new')}
                className="text-sm font-semibold text-cobalt hover:underline"
              >
                {addressMode === 'new' ? '← Use a saved address' : '+ Deliver to a new address'}
              </button>
            </div>
          )}

          {addressMode === 'new' && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Full name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Pablo Rubio"
                  className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Street address *
                </label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Calle Gran Vía 24, 3ºB"
                  className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Apartment, suite, etc. (optional)
                </label>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Door B"
                  className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Madrid"
                  className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Postal code *
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="28013"
                  className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Country *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                >
                  <option value="ES">Spain (ES)</option>
                  <option value="RO">Romania (RO)</option>
                  <option value="FR">France (FR)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="IT">Italy (IT)</option>
                  <option value="PT">Portugal (PT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="rounded accent-cobalt"
                />
                Save this address to my account for future orders
              </label>
            </div>
          )}
        </section>

        {/* PASO 2: MÉTODO DE ENVÍO */}
        <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
              2
            </span>
            <h2 className="font-display text-xl font-bold">Delivery method</h2>
          </div>

          <div className="mt-5 space-y-3">
            {SHIPPING_OPTIONS.map((option) => {
              const isSelected = shippingMethod === option.id;
              return (
                <label
                  key={option.id}
                  onClick={() => setShippingMethod(option.id)}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition ${
                    isSelected
                      ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt'
                      : 'border-line hover:bg-fog/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={isSelected}
                      onChange={() => setShippingMethod(option.id)}
                      className="mt-1 accent-cobalt"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{option.name}</p>
                      <p className="text-xs text-muted">{option.description}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">{formatPrice(option.cost)}</span>
                </label>
              );
            })}
          </div>
        </section>
      </div>

      {/* Columna derecha: Paso 3 (Resumen del pedido + Cupón) y Paso 4 (Pago) */}
      <div className="lg:col-span-5">
        <section className="sticky top-24 rounded-2xl bg-white p-6 ring-1 ring-line">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
              3
            </span>
            <h2 className="font-display text-xl font-bold">Order summary</h2>
          </div>

          <ul className="mt-5 divide-y divide-line">
            {items.map((item) => {
              const meta = getCategoryMeta(item.categoryName);
              return (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <div
                    className="relative h-14 w-10 shrink-0 rounded-lg"
                    style={{ background: meta.tint }}
                  >
                    <CaseArt
                      kind={meta.key}
                      seed={item.productId}
                      className="absolute inset-[10%]"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-muted">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          {/* Campo de código promocional (B5) */}
          <div className="mt-4 border-t border-line pt-4">
            <label htmlFor="promoCode" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Discount code
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="promoCode"
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="e.g. WELCOME15"
                className="min-w-0 flex-1 rounded-xl border border-line px-3.5 py-2 text-sm uppercase outline-none focus:border-cobalt"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading}
                className="shrink-0 rounded-xl border border-ink px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink hover:text-white disabled:opacity-50"
              >
                {promoLoading ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {promoError && <p className="mt-1.5 text-xs font-medium text-red-600">{promoError}</p>}
            {appliedPromo && (
              <div className="mt-1.5 flex items-center justify-between text-xs font-medium text-green-700">
                <span>Code {appliedPromo.code} applied!</span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoInput('');
                  }}
                  className="underline hover:text-green-900"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between text-green-700">
                <span>Discount ({appliedPromo.code})</span>
                <span className="font-semibold">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <span>Shipping ({selectedShipping.name})</span>
              <span className="font-medium text-gray-900">
                {formatPrice(selectedShipping.cost)}
              </span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition hover:bg-cobalt disabled:opacity-50"
          >
            {loading ? 'Redirecting to payment...' : `Continue to payment · ${formatPrice(total)}`}
          </button>

          <p className="mt-3 text-center text-xs text-muted">
            Step 4: Secure card payment via Stripe (Test Mode)
          </p>
        </section>
      </div>
    </form>
  );
}