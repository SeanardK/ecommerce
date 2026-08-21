import { describe, expect, it } from 'vitest';
import { formatCents, lineTotalCents, subtotalCents } from './money';

describe('money', () => {
  it('formats cents as currency', () => {
    expect(formatCents(12900)).toBe('$129.00');
    expect(formatCents(1500)).toBe('$15.00');
  });

  it('computes a line total', () => {
    expect(lineTotalCents({ quantity: 3, unit_price_cents: 1000 })).toBe(3000);
  });

  it('sums a subtotal across lines', () => {
    expect(
      subtotalCents([
        { quantity: 2, unit_price_cents: 1500 },
        { quantity: 1, unit_price_cents: 2000 },
      ]),
    ).toBe(5000);
  });
});
