// Lógica pura del carrito (sin Next ni Prisma) para poder probarla con tests (A12).
// El dinero se calcula en céntimos (enteros) para evitar errores de coma flotante.

export function toCents(price: number | string): number {
  return Math.round(Number(price) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export interface PricedLine {
  unitPrice: number | string;
  quantity: number;
}

export function lineTotalCents(line: PricedLine): number {
  return toCents(line.unitPrice) * line.quantity;
}

export function cartTotals(lines: PricedLine[]): { itemCount: number; subtotalCents: number } {
  return {
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotalCents: lines.reduce((sum, l) => sum + lineTotalCents(l), 0),
  };
}

export type StockCheck = { ok: true; quantity: number } | { ok: false; error: string };

/**
 * Comprueba que se puede tener `requested` unidades más de un producto.
 * `inCart` son las que ya hay en el carrito (0 al editar una línea con la cantidad final).
 * Rechaza cantidades inválidas y cantidades superiores al stock.
 */
export function checkStock({
  requested,
  inCart = 0,
  stock,
}: {
  requested: unknown;
  inCart?: number;
  stock: number;
}): StockCheck {
  const qty = Number(requested);
  if (!Number.isInteger(qty) || qty < 1) return { ok: false, error: 'Choose a quantity of 1 or more.' };
  if (stock <= 0) return { ok: false, error: 'This case is sold out.' };

  const total = inCart + qty;
  if (total > stock) {
    return {
      ok: false,
      error: inCart > 0 ? `You have ${inCart} in your cart and only ${stock} are in stock.` : `Only ${stock} left in stock.`,
    };
  }
  return { ok: true, quantity: total };
}
