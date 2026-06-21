import sharp from 'sharp'

const MAX_DIMENSION = 4096

export interface ResizeResult {
  cover: string   // data:image/jpeg;base64,…
  contain: string // data:image/jpeg;base64,…
}

export async function resizeImage(
  inputBuffer: Buffer,
  width: number,
  height: number,
  bgColor = '#ffffff'
): Promise<ResizeResult> {
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`Output dimensions cannot exceed ${MAX_DIMENSION}px on either axis`)
  }

  const [coverBuffer, containBuffer] = await Promise.all([
    // Cover: scale to completely fill the target box, cropping whatever overflows.
    // flatten() composites any alpha channel onto white before JPEG encoding.
    sharp(inputBuffer)
      .resize(width, height, { fit: 'cover' })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 90 })
      .toBuffer(),

    // Contain: scale so the whole image fits, padding the empty space with bgColor.
    // background fills the letterbox padding; flatten fills transparent pixels in the content.
    sharp(inputBuffer)
      .resize(width, height, { fit: 'contain', background: bgColor })
      .flatten({ background: bgColor })
      .jpeg({ quality: 90 })
      .toBuffer(),
  ])

  return {
    cover: `data:image/jpeg;base64,${coverBuffer.toString('base64')}`,
    contain: `data:image/jpeg;base64,${containBuffer.toString('base64')}`,
  }
}
