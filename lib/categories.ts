import type { CaseKind } from './case-art';

export interface CategoryMeta {
  key: CaseKind;
  /** Nombre exacto de la categoría en la base de datos (prisma/seed.ts) */
  name: string;
  blurb: string;
  /** Color de fondo suave para las tarjetas de esta categoría */
  tint: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'clear', name: 'Clear Minimalist', blurb: 'Slim, see-through shells that show off your phone.', tint: '#E1ECF3' },
  { key: 'magsafe', name: 'MagSafe Compatible', blurb: 'Built-in magnets for chargers, wallets and mounts.', tint: '#F8E2DA' },
  { key: 'eco', name: 'Eco-Friendly Biodegradable', blurb: 'Plant-based and compostable materials.', tint: '#E2E9D8' },
  { key: 'rugged', name: 'Ultra-Impact Rugged', blurb: 'Layered armor built for serious drops.', tint: '#ECE8D6' },
  { key: 'leather', name: 'Leather Wallet Cases', blurb: 'Folio cases with card slots that age well.', tint: '#EEDFD1' },
];

/** Devuelve la ficha visual de una categoría a partir de su nombre en la BD. */
export function getCategoryMeta(name: string): CategoryMeta {
  const n = (name || '').toLowerCase();
  return (
    CATEGORIES.find((c) => c.name.toLowerCase() === n) ||
    CATEGORIES.find((c) => n.includes(c.key)) ||
    CATEGORIES[0]
  );
}
