/**
 * Detects Amazon product page URLs and extracts the main product image from them.
 * Non-Amazon URLs pass through unchanged — existing behavior is preserved.
 */

/**
 * Returns true for amazon.* storefronts and amzn.to shortened links.
 * Does NOT match Amazon CDN domains like m.media-amazon.com.
 */
export function isAmazonUrl(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl)
    // (^|\.) ensures amazon is at the hostname root or a subdomain boundary,
    // not embedded in another word (e.g. m.media-amazon.com must not match).
    return (
      /(^|\.)amazon\.[a-z]{2,3}(\.[a-z]{2})?$/i.test(hostname) ||
      hostname === 'amzn.to'
    )
  } catch {
    return false
  }
}

// ASINs appear after /dp/, /product/, /gp/product/, or /exec/obidos/ASIN/
const ASIN_RE = /\/(?:dp|product|gp\/product|exec\/obidos\/ASIN)\/([A-Z0-9]{10})/i

/**
 * Extracts the 10-character ASIN from an Amazon product URL.
 * Returns null for URLs that contain no ASIN (e.g. amzn.to short links, search pages).
 */
export function extractAsin(url: string): string | null {
  const match = url.match(ASIN_RE)
  return match?.[1]?.toUpperCase() ?? null
}

/**
 * Constructs the direct Amazon catalog CDN image URL for a given ASIN.
 * This bypasses the product page entirely — no HTML fetch, no bot detection.
 */
export function asinToCdnUrl(asin: string): string {
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`
}

/**
 * Extracts the main product image URL from a raw HTML string.
 * Exported as a pure function so it can be unit-tested without network calls.
 * Returns null when no recognisable image is found.
 */
export function parseAmazonImage(html: string): string | null {
  // og:image is the most reliable — Amazon sets it to the main product image.
  // Handle both attribute orderings that browsers emit.
  const m1 = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  )
  if (m1?.[1]) return m1[1]

  const m2 = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
  )
  if (m2?.[1]) return m2[1]

  // data-old-hires holds the high-res product image on many Amazon pages.
  const m3 = html.match(
    /id=["']landingImage["'][^>]+data-old-hires=["']([^"']+)["']/i
  )
  if (m3?.[1]) return m3[1]

  // src of the main product image element (may be a lower-res thumbnail).
  const m4 = html.match(
    /id=["']landingImage["'][^>]+src=["']([^"']+)["']/i
  )
  if (m4?.[1]) return m4[1]

  // Older Amazon layout used this id.
  const m5 = html.match(
    /id=["']imgBlkFront["'][^>]+src=["']([^"']+)["']/i
  )
  if (m5?.[1]) return m5[1]

  return null
}

/**
 * Returns the direct image URL for an Amazon product page URL.
 *
 * Primary path  — ASIN is present in the URL (amazon.com/dp/…):
 *   Constructs the CDN image URL directly. No HTML fetch, no bot detection.
 *
 * Fallback path — no ASIN in the URL (amzn.to short links):
 *   Fetches the page and scrapes the image from HTML.
 *
 * Throws a user-friendly Error on any failure.
 */
export async function extractAmazonImage(pageUrl: string): Promise<string> {
  // Primary: derive the image URL directly from the ASIN — zero network calls,
  // so Amazon's bot-detection cannot interfere.
  const asin = extractAsin(pageUrl)
  if (asin) {
    return asinToCdnUrl(asin)
  }

  // Fallback: fetch the HTML and scrape (used for amzn.to shortened URLs where
  // the ASIN is not present in the URL itself).
  let res: Response
  try {
    res = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12_000),
      redirect: 'follow',
    })
  } catch {
    throw new Error(
      'Could not reach the Amazon page. Please check the URL and try again.'
    )
  }

  if (!res.ok) {
    throw new Error(
      `Amazon returned an error (${res.status}). ` +
      'The product may be unavailable or the URL may be incorrect.'
    )
  }

  const html = await res.text()
  const imageUrl = parseAmazonImage(html)

  if (!imageUrl) {
    throw new Error(
      'Could not find a product image on this Amazon page. ' +
      'Amazon may have blocked the request — try pasting the image URL directly.'
    )
  }

  return imageUrl
}
