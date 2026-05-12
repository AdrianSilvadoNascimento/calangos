/** Tiny className joiner — drops falsy values, joins with single space. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
