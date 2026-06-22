import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { verifyPassword, getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, password } = body

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  try {
    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    // Same error for both "user not found" and "wrong password" — avoids leaking which emails exist
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const session = await getSession()
    session.userId = user._id.toString()
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({ user: { id: user._id, email: user.email, credits: user.credits } })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
