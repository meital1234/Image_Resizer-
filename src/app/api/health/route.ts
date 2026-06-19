import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

// GET /api/health
// Returns 200 if the server can reach MongoDB, 500 otherwise.
// Use this to verify your .env.local is set up correctly.
export async function GET() {
  try {
    await connectDB()
    return NextResponse.json({ status: 'ok', db: 'connected' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { status: 'error', db: 'disconnected', message },
      { status: 500 }
    )
  }
}
