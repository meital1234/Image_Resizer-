/// <reference types="jest" />
import { isAmazonUrl, extractAsin, asinToCdnUrl, parseAmazonImage } from './amazon'

// extractAmazonImage is not tested here because it makes real network calls.
// isAmazonUrl and parseAmazonImage are pure functions — no mocks needed.

describe('isAmazonUrl', () => {
  it.each([
    // Amazon storefronts
    ['https://www.amazon.com/dp/B0ABC123DE', true],
    ['https://amazon.com/dp/B0ABC123DE', true],
    ['https://www.amazon.co.uk/dp/B0ABC123DE', true],
    ['https://www.amazon.de/dp/B0ABC123DE', true],
    ['https://www.amazon.co.jp/dp/B0ABC123DE', true],
    // Shortened links
    ['https://amzn.to/3XYZabc', true],
    // Non-Amazon
    ['https://example.com/image.jpg', false],
    ['https://not-amazon.com/dp/B0ABC', false],
    // Amazon CDN — should NOT trigger HTML scraping
    ['https://m.media-amazon.com/images/I/foo.jpg', false],
    ['https://images-na.ssl-images-amazon.com/images/I/bar.jpg', false],
  ])('%s → %s', (url, expected) => {
    expect(isAmazonUrl(url)).toBe(expected)
  })
})

describe('extractAsin', () => {
  it.each([
    // Standard /dp/ path
    ['https://www.amazon.com/dp/B003TG75EG', 'B003TG75EG'],
    // Product name before /dp/
    ['https://www.amazon.com/Some-Product/dp/B0ABC12345/ref=sr_1_1', 'B0ABC12345'],
    // Other Amazon storefronts
    ['https://www.amazon.co.uk/dp/B0ABC12345', 'B0ABC12345'],
    ['https://www.amazon.de/dp/B0ABC12345', 'B0ABC12345'],
    // /product/ path
    ['https://www.amazon.com/gp/product/B0ABC12345', 'B0ABC12345'],
    // Short links have no ASIN in the URL
    ['https://amzn.to/3XYZabc', null],
    // Search page has no ASIN
    ['https://www.amazon.com/s?k=headphones', null],
  ])('%s → %s', (url, expected) => {
    expect(extractAsin(url)).toBe(expected)
  })
})

describe('asinToCdnUrl', () => {
  it('builds the correct CDN URL', () => {
    expect(asinToCdnUrl('B003TG75EG')).toBe(
      'https://images-na.ssl-images-amazon.com/images/P/B003TG75EG.01._SCLZZZZZZZ_.jpg'
    )
  })

  it('returns a valid absolute https URL', () => {
    const url = asinToCdnUrl('B0ABC12345')
    expect(() => new URL(url)).not.toThrow()
    expect(new URL(url).protocol).toBe('https:')
  })

  it('embeds the ASIN in the path', () => {
    expect(asinToCdnUrl('B0XYZ99999')).toContain('B0XYZ99999')
  })
})

describe('parseAmazonImage', () => {
  it('extracts og:image when property attribute comes before content', () => {
    const html = `<meta property="og:image" content="https://m.media-amazon.com/images/I/og-first.jpg" />`
    expect(parseAmazonImage(html)).toBe('https://m.media-amazon.com/images/I/og-first.jpg')
  })

  it('extracts og:image when content attribute comes before property', () => {
    const html = `<meta content="https://m.media-amazon.com/images/I/og-second.jpg" property="og:image" />`
    expect(parseAmazonImage(html)).toBe('https://m.media-amazon.com/images/I/og-second.jpg')
  })

  it('falls back to data-old-hires on landingImage', () => {
    const html = `<img id="landingImage" data-old-hires="https://images-na.ssl-images-amazon.com/images/I/hi-res.jpg" src="https://images-na.ssl-images-amazon.com/images/I/lo-res.jpg" />`
    expect(parseAmazonImage(html)).toBe(
      'https://images-na.ssl-images-amazon.com/images/I/hi-res.jpg'
    )
  })

  it('falls back to src of landingImage when data-old-hires is absent', () => {
    const html = `<img id="landingImage" src="https://images-na.ssl-images-amazon.com/images/I/landing.jpg" />`
    expect(parseAmazonImage(html)).toBe(
      'https://images-na.ssl-images-amazon.com/images/I/landing.jpg'
    )
  })

  it('falls back to src of imgBlkFront on older Amazon layouts', () => {
    const html = `<img id="imgBlkFront" src="https://images-na.ssl-images-amazon.com/images/I/front.jpg" />`
    expect(parseAmazonImage(html)).toBe(
      'https://images-na.ssl-images-amazon.com/images/I/front.jpg'
    )
  })

  it('prefers og:image over all other sources', () => {
    const html = `
      <meta property="og:image" content="https://m.media-amazon.com/images/I/og.jpg" />
      <img id="landingImage" data-old-hires="https://images-na.ssl-images-amazon.com/images/I/hires.jpg" src="https://images-na.ssl-images-amazon.com/images/I/lo.jpg" />
    `
    expect(parseAmazonImage(html)).toBe('https://m.media-amazon.com/images/I/og.jpg')
  })

  it('returns null when the page contains no recognisable image', () => {
    expect(parseAmazonImage('<html><body>No image here</body></html>')).toBeNull()
  })
})
