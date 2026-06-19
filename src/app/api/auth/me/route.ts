import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()

  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await connectDB()
  const user = await User.findById(session.userId).select('-password')

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: { id: user._id, email: user.email, credits: user.credits } })
}
