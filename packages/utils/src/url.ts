/**
 * Normalizes a URL by removing tracking parameters, fragments, and ensuring
 * consistent formatting for cache key generation.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());

    // Remove common tracking params
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'tag', 'linkCode', 'ref_',
    ];
    trackingParams.forEach((param) => url.searchParams.delete(param));

    // Remove fragment
    url.hash = '';

    // Lowercase hostname
    url.hostname = url.hostname.toLowerCase();

    return url.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Extracts the domain from a URL, removing 'www.' prefix.
 */
export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return 'desconhecido';
  }
}

/**
 * Checks if a string is a valid URL.
 */
export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts the first URL from a text string.
 * Useful for Share Intent where stores send "Product Title - R$ 299 https://..."
 */
export function extractUrlFromText(text: string): string | null {
  const match = text.match(/https?:\/\/\S+/i);
  return match ? match[0] : null;
}
