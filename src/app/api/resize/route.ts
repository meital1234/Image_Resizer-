import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getSession } from '@/lib/auth'
import { resizeImage } from '@/lib/resize'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']

export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // ── 2. Parse FormData ─────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file          = formData.get('file')         as File   | null
  const url           = formData.get('url')          as string | null
  const targetWidthRaw  = formData.get('targetWidth')  as string | null
  const targetHeightRaw = formData.get('targetHeight') as string | null
  const aspectWRaw    = formData.get('aspectW')      as string | null
  const aspectHRaw    = formData.get('aspectH')      as string | null
  const bgColor       = (formData.get('bgColor') as string | null) ?? '#ffffff'

  // ── 3. Validate image source ──────────────────────────────────────────────
  if (!file && !url) {
    return NextResponse.json({ error: 'Provide either a file or a URL' }, { status: 400 })
  }
  if (file && url) {
    return NextResponse.json({ error: 'Provide a file or a URL, not both' }, { status: 400 })
  }

  // ── 4. Validate targetWidth (always required) ─────────────────────────────
  if (!targetWidthRaw) {
    return NextResponse.json({ error: 'targetWidth is required' }, { status: 400 })
  }
  const targetWidth = parseInt(targetWidthRaw, 10)
  if (isNaN(targetWidth) || targetWidth <= 0) {
    return NextResponse.json({ error: 'targetWidth must be a positive number' }, { status: 400 })
  }

  // ── 5. Validate targetHeight or aspect ratio ──────────────────────────────
  let targetHeight: number

  if (targetHeightRaw) {
    // Explicit dimensions mode
    targetHeight = parseInt(targetHeightRaw, 10)
    if (isNaN(targetHeight) || targetHeight <= 0) {
      return NextResponse.json({ error: 'targetHeight must be a positive number' }, { status: 400 })
    }
  } else if (aspectWRaw && aspectHRaw) {
    // Aspect ratio mode: server calculates height from width × (H/W)
    const aspectW = parseInt(aspectWRaw, 10)
    const aspectH = parseInt(aspectHRaw, 10)
    if (isNaN(aspectW) || isNaN(aspectH) || aspectW <= 0 || aspectH <= 0) {
      return NextResponse.json({ error: 'Aspect ratio values must be positive numbers' }, { status: 400 })
    }
    targetHeight = Math.round(targetWidth * (aspectH / aspectW))
  } else {
    return NextResponse.json(
      { error: 'Provide either targetHeight, or both aspectW and aspectH' },
      { status: 400 }
    )
  }

  // ── 6. Early credit check (fast fail before doing any work) ──────────────
  await connectDB()
  const user = await User.findById(session.userId)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (user.credits < 1) {
    return NextResponse.json({ error: 'Buy more credits.' }, { status: 402 })
  }

  // ── 7. Read image into a Buffer ───────────────────────────────────────────
  let inputBuffer: Buffer

  if (file) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type "${file.type}". Allowed: JPEG, PNG, WebP, GIF, BMP` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 400 })
    }
    inputBuffer = Buffer.from(await file.arrayBuffer())
  } else {
    // URL mode
    const urlStr = url!

    let parsedUrl: URL
    try {
      parsedUrl = new URL(urlStr)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
    }

    let fetchResponse: Response
    try {
      fetchResponse = await fetch(urlStr, {
        signal: AbortSignal.timeout(10_000), // 10-second timeout
      })
    } catch {
      return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 })
    }

    if (!fetchResponse.ok) {
      return NextResponse.json(
        { error: `Could not fetch image: remote server returned ${fetchResponse.status}` },
        { status: 400 }
      )
    }

    const contentType = fetchResponse.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL does not point to an image' }, { status: 400 })
    }

    const arrayBuffer = await fetchResponse.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Remote image too large. Maximum size is 5 MB.' }, { status: 400 })
    }

    inputBuffer = Buffer.from(arrayBuffer)
  }

  // ── 8. Process the image ──────────────────────────────────────────────────
  let resizeResult: { cover: string; contain: string }
  try {
    resizeResult = await resizeImage(inputBuffer, targetWidth, targetHeight, bgColor)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image processing failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // ── 9. Deduct 1 credit atomically ─────────────────────────────────────────
  // The { credits: { $gte: 1 } } in the filter means the update only succeeds if
  // the user still has credits at the moment the DB write happens. This prevents
  // two simultaneous requests from both consuming the last credit.
  const updatedUser = await User.findOneAndUpdate(
    { _id: session.userId, credits: { $gte: 1 } },
    { $inc: { credits: -1 } },
    { new: true }
  )

  if (!updatedUser) {
    return NextResponse.json({ error: 'Buy more credits.' }, { status: 402 })
  }

  // ── 10. Respond ───────────────────────────────────────────────────────────
  return NextResponse.json({
    cover:      resizeResult.cover,
    contain:    resizeResult.contain,
    dimensions: { width: targetWidth, height: targetHeight },
    newCredits: updatedUser.credits,
  })
}
