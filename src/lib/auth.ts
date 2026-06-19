import bcrypt from 'bcryptjs'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { type SessionData, sessionOptions } from './session'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Call this inside any Route Handler or Server Component to read/write the session cookie.
// Changes are only persisted when you call session.save() afterward.
export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions)
}
