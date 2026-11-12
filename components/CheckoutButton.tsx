'use client';

import { useState } from 'react';

interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
}

export default function CheckoutButton({ items }: { items: CheckoutItem[] }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Checkout error: ${data.error || 'Could not start payment'}`);
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Network error connecting to Stripe.');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className="w-full rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {loading ? 'Redirecting to checkout...' : 'Proceed to Checkout'}
    </button>
  );
}