import type { SessionOptions } from 'iron-session'

// The data we store inside the encrypted session cookie
export interface SessionData {
  userId: string
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  // Must be at least 32 characters — set in .env.local
  password: process.env.SESSION_SECRET as string,
  cookieName: 'image-resizer-session',
  cookieOptions: {
    // In production the cookie is only sent over HTTPS
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,   // JS in the browser cannot read this cookie
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
  },
}
