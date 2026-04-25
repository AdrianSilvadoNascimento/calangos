import { Injectable, Logger } from '@nestjs/common';
import { extractDomain } from '@enxoval/utils';
import * as cheerio from 'cheerio';

export interface ScrapedMetadata {
  title: string | null;
  image: string | null;
  description: string | null;
  priceCents: number | null;
  storeName: string;
}

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

// Sites like Shopee block regular User-Agents but serve OpenGraph tags
// to social-network crawlers so links can be previewed in WhatsApp / Facebook.
const SOCIAL_BOT_HEADERS: Record<string, string> = {
  'User-Agent':
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

// Domains that always need the social-bot UA to return useful metadata.
const SOCIAL_BOT_DOMAINS = ['shopee.com.br', 'shopee.com'];

const STORE_NAME_BY_DOMAIN: Record<string, string> = {
  'shopee.com.br': 'Shopee',
  'shopee.com': 'Shopee',
  'mercadolivre.com.br': 'Mercado Livre',
  'mercadolibre.com': 'Mercado Livre',
  'amazon.com.br': 'Amazon',
  'amazon.com': 'Amazon',
  'magazineluiza.com.br': 'Magazine Luiza',
  'magalu.com': 'Magazine Luiza',
  'americanas.com.br': 'Americanas',
  'casasbahia.com.br': 'Casas Bahia',
  'pontofrio.com.br': 'Ponto Frio',
  'extra.com.br': 'Extra',
  'submarino.com.br': 'Submarino',
  'kabum.com.br': 'KaBuM!',
  'aliexpress.com': 'AliExpress',
  'pt.aliexpress.com': 'AliExpress',
  'leroymerlin.com.br': 'Leroy Merlin',
  'tokstok.com.br': 'Tok&Stok',
  'mobly.com.br': 'Mobly',
  'madeiramadeira.com.br': 'MadeiraMadeira',
  'etna.com.br': 'Etna',
  'ikea.com': 'IKEA',
};

function friendlyStoreName(domain: string, fallback?: string | null): string {
  const known = STORE_NAME_BY_DOMAIN[domain];
  if (known) return known;
  if (fallback?.trim()) return fallback.trim();
  // Capitalize first segment: "loja-exemplo.com.br" → "Loja-exemplo"
  const first = domain.split('.')[0] ?? domain;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  async scrape(rawUrl: string): Promise<ScrapedMetadata> {
    const domain = extractDomain(rawUrl);
    this.logger.log(`Scraping: ${rawUrl} (${domain})`);

    const useSocialBot = SOCIAL_BOT_DOMAINS.some((d) => domain.endsWith(d));
    const result = await this.scrapeWithHeaders(
      rawUrl,
      domain,
      useSocialBot ? SOCIAL_BOT_HEADERS : BROWSER_HEADERS,
    );

    // If the regular fetch returned almost nothing, retry with social-bot UA.
    if (!useSocialBot && !result.title && !result.image) {
      this.logger.log(`Empty metadata, retrying with social-bot UA: ${rawUrl}`);
      const retried = await this.scrapeWithHeaders(
        rawUrl,
        domain,
        SOCIAL_BOT_HEADERS,
      );
      if (retried.title || retried.image) return retried;
    }

    return result;
  }

  private async scrapeWithHeaders(
    rawUrl: string,
    domain: string,
    headers: Record<string, string>,
  ): Promise<ScrapedMetadata> {
    let title: string | null = null;
    let image: string | null = null;
    let description: string | null = null;
    let priceCents: number | null = null;
    let siteName: string | null = null;

    try {
      const response = await fetch(rawUrl, { headers, redirect: 'follow' });
      if (!response.ok) {
        this.logger.warn(`Fetch ${response.status} for ${rawUrl}`);
        return {
          title: null,
          image: null,
          description: null,
          priceCents: null,
          storeName: friendlyStoreName(domain),
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // 1. OpenGraph / Twitter cards
      title =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').first().text().trim() ||
        null;

      image =
        $('meta[property="og:image:secure_url"]').attr('content') ||
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        null;

      description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        null;

      siteName = $('meta[property="og:site_name"]').attr('content') || null;

      const ogPrice =
        $('meta[property="product:price:amount"]').attr('content') ||
        $('meta[property="og:price:amount"]').attr('content');
      if (ogPrice) {
        const parsed = parseFloat(ogPrice.replace(',', '.'));
        if (!isNaN(parsed)) priceCents = Math.round(parsed * 100);
      }

      // 2. JSON-LD — covers Shopee fallback, Mercado Livre, Amazon, most ecommerce.
      if (!title || !image || priceCents == null) {
        const jsonLd = this.extractJsonLdProduct($);
        if (jsonLd) {
          title = title || jsonLd.title;
          image = image || jsonLd.image;
          description = description || jsonLd.description;
          if (priceCents == null && jsonLd.priceCents != null) priceCents = jsonLd.priceCents;
        }
      }

      // 3. Last-resort fallbacks.
      if (!title) title = $('h1').first().text().trim() || null;
      if (!image) {
        const firstBigImg = $('img[src]')
          .toArray()
          .map((el) => $(el).attr('src'))
          .find((src): src is string => !!src && /^https?:\/\//.test(src));
        image = firstBigImg ?? null;
      }
    } catch (error) {
      this.logger.error(`Failed to scrape ${rawUrl}`, error);
    }

    return {
      title: title || null,
      image: image || null,
      description: description || null,
      priceCents,
      storeName: friendlyStoreName(domain, siteName),
    };
  }

  private extractJsonLdProduct(
    $: cheerio.CheerioAPI,
  ): { title: string | null; image: string | null; description: string | null; priceCents: number | null } | null {
    const blocks = $('script[type="application/ld+json"]').toArray();
    for (const el of blocks) {
      const raw = $(el).text().trim();
      if (!raw) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const candidates: any[] = Array.isArray(parsed) ? parsed : [parsed];
      // @graph can hold an array of typed nodes.
      for (const node of [...candidates]) {
        if (node && typeof node === 'object' && Array.isArray((node as any)['@graph'])) {
          candidates.push(...(node as any)['@graph']);
        }
      }

      for (const node of candidates) {
        if (!node || typeof node !== 'object') continue;
        const type = (node as any)['@type'];
        const isProduct =
          type === 'Product' ||
          (Array.isArray(type) && type.includes('Product'));
        if (!isProduct) continue;

        const product = node as any;
        const image = Array.isArray(product.image)
          ? product.image[0]
          : typeof product.image === 'object' && product.image?.url
            ? product.image.url
            : product.image ?? null;

        let priceCents: number | null = null;
        const offers = product.offers;
        const offerNode = Array.isArray(offers) ? offers[0] : offers;
        const priceRaw = offerNode?.price ?? offerNode?.lowPrice ?? null;
        if (priceRaw != null) {
          const parsedPrice = parseFloat(String(priceRaw).replace(',', '.'));
          if (!isNaN(parsedPrice)) priceCents = Math.round(parsedPrice * 100);
        }

        return {
          title: typeof product.name === 'string' ? product.name : null,
          image: typeof image === 'string' ? image : null,
          description: typeof product.description === 'string' ? product.description : null,
          priceCents,
        };
      }
    }
    return null;
  }

}
