/**
 * Formats a price in cents to Brazilian Real (BRL) currency string.
 * Example: 29990 → "R$ 299,90"
 */
export function formatBRL(priceCents: number | null | undefined): string {
  if (priceCents == null) return '';

  const reais = priceCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

/**
 * Parses a Brazilian currency string to cents.
 * Example: "R$ 299,90" → 29990
 */
export function parseBRL(value: string): number | null {
  const cleaned = value
    .replace(/[R$\s.]/g, '')
    .replace(',', '.');

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  return Math.round(num * 100);
}
