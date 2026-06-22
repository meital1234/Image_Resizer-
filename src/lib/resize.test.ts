/// <reference types="jest" />
import sharp from 'sharp'
import { resizeImage } from './resize'

/** Creates a small in-memory JPEG buffer — no disk I/O, no network, no DB. */
async function makeTestBuffer(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 100, g: 149, b: 237 },
    },
  })
    .jpeg()
    .toBuffer()
}

describe('resizeImage', () => {
  let src: Buffer

  beforeAll(async () => {
    src = await makeTestBuffer(200, 150)
  })

  it('cover result has exactly the requested dimensions', async () => {
    const result = await resizeImage(src, 80, 50)
    const raw = result.cover.replace('data:image/jpeg;base64,', '')
    const meta = await sharp(Buffer.from(raw, 'base64')).metadata()
    expect(meta.width).toBe(80)
    expect(meta.height).toBe(50)
  })

  it('contain result has exactly the requested dimensions', async () => {
    const result = await resizeImage(src, 80, 50)
    const raw = result.contain.replace('data:image/jpeg;base64,', '')
    const meta = await sharp(Buffer.from(raw, 'base64')).metadata()
    expect(meta.width).toBe(80)
    expect(meta.height).toBe(50)
  })

  it('both results are valid base64 JPEG data URLs', async () => {
    const result = await resizeImage(src, 40, 40)
    expect(result.cover).toMatch(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/)
    expect(result.contain).toMatch(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/)
  })

  it('throws when a dimension exceeds MAX_DIMENSION (4096)', async () => {
    await expect(resizeImage(src, 5000, 100)).rejects.toThrow(
      'Output dimensions cannot exceed 4096px on either axis'
    )
  })

  it('throws when the input buffer is not a valid image', async () => {
    const garbage = Buffer.from('this is not an image')
    await expect(resizeImage(garbage, 100, 100)).rejects.toThrow()
  })
})
