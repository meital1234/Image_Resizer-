import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { verifyPassword, getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

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
}
