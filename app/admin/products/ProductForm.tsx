'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CategoryOption {
  id: number;
  name: string;
}

interface ProductInitialData {
  id?: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image: string;
  categoryId: number;
  active: boolean;
}

interface ProductFormProps {
  categories: CategoryOption[];
  initial?: ProductInitialData;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

export default function ProductForm({
  categories,
  initial,
  action,
  submitLabel,
}: ProductFormProps) {
  const [imageUrl, setImageUrl] = useState(initial?.image || '/placeholder.png');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setImageUrl(data.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="max-w-2xl space-y-5 rounded-2xl bg-white p-6 ring-1 ring-line">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="image" value={imageUrl} />

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Product name *
        </label>
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name ?? ''}
          placeholder="CarbonGuard Pro MagSafe Case"
          className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Description *
        </label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={initial?.description ?? ''}
          placeholder="Aramid fiber weave with raised camera lip and aluminum buttons."
          className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Price (€) *
          </label>
          <input
            type="number"
            name="price"
            step="0.01"
            min="0.50"
            required
            defaultValue={initial?.price ?? '19.99'}
            className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Stock units *
          </label>
          <input
            type="number"
            name="stock"
            min="0"
            required
            defaultValue={initial?.stock ?? 20}
            className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Category *
          </label>
          <select
            name="categoryId"
            required
            defaultValue={initial?.categoryId ?? categories[0]?.id}
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-cobalt"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subida de imagen (A9) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Product image (JPG, PNG, WEBP)
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-line bg-fog">
            {imageUrl && imageUrl !== '/placeholder.png' ? (
              <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-center text-[11px] text-muted">Default art</span>
            )}
          </div>

          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-fog file:px-4 file:py-2 file:text-xs file:font-semibold file:text-gray-900 hover:file:bg-line"
            />
            <p className="mt-1 text-xs text-muted">
              {uploading ? 'Uploading image...' : `Current path: ${imageUrl}`}
            </p>
            {uploadError && <p className="mt-1 text-xs font-medium text-red-600">{uploadError}</p>}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial ? initial.active : true}
          className="rounded accent-cobalt"
        />
        Visible in store catalog (Active)
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={uploading}
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/products"
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-fog"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}