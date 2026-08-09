import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/eval') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/assessment') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname === '/apple-icon.png' ||
    pathname === '/icon.png'
  ) {
    return NextResponse.next()
  }

  // Protect /admin and /api/dashboard and /api/invites
  const guestCookie = request.cookies.get('tai_guest_id')?.value

  if (!guestCookie && (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/dashboard') ||
    pathname.startsWith('/api/invites')
  )) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Forward the org_id in a header for API routes
  if (guestCookie) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tai-org-id', guestCookie)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png).*)',
  ],
}
