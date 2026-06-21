import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getSession } from '@/lib/auth'

export async function DELETE() {
  // 1. Verify the caller is authenticated
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await connectDB()

  // 2. Delete the user document atomically (find + delete in one MongoDB operation)
  const deleted = await User.findByIdAndDelete(session.userId)

  if (!deleted) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 3. Destroy the session cookie so the browser can no longer make authenticated requests.
  //    try/finally ensures this always runs even if something unexpected happens above.
  try {
    session.destroy()
  } finally {
    return NextResponse.json({ ok: true })
  }
}
