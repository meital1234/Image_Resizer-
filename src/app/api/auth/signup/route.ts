import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { hashPassword, getSession } from '@/lib/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let body: { name?: unknown; email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, password } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  try {
    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 409 })
    }

    const hashed = await hashPassword(password)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      credits: 5,
    })

    const session = await getSession()
    session.userId = user._id.toString()
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json(
      { user: { id: user._id, email: user.email, credits: user.credits } },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
