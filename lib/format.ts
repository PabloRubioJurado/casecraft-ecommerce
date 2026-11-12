const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

export function formatPrice(value: number | string): string {
  return eur.format(Number(value));
}
