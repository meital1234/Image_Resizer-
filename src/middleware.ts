import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import { type SessionData, sessionOptions } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  // API routes handle their own auth — let them through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Read and decrypt the session cookie without calling getIronSession.
  // getIronSession's type overloads don't accept NextRequest/NextResponse in
  // middleware context, so we use unsealData directly instead.
  let isLoggedIn = false
  const cookieName = sessionOptions.cookieName as string
  const rawCookie = request.cookies.get(cookieName)?.value

  if (rawCookie) {
    try {
      const data = await unsealData<SessionData>(rawCookie, {
        password: sessionOptions.password as string,
      })
      isLoggedIn = data.isLoggedIn === true
    } catch {
      // Tampered or expired cookie — treat as logged out
    }
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
