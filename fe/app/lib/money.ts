export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export interface PricedLine {
  quantity: number;
  unit_price_cents: number;
}

export function lineTotalCents(line: PricedLine): number {
  return line.quantity * line.unit_price_cents;
}

export function subtotalCents(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotalCents(line), 0);
}
