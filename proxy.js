import { NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function proxy(request) {
  const { pathname } = request.nextUrl

  // Allow public paths through without any checks
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value

  // No token → redirect to login (for pages) or return 401 (for APIs)
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Authentication required.' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)

  // Invalid or expired token
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Token invalid or expired.' },
        { status: 401 }
      )
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  // Admin-only routes: /admin page and /api/admin/** endpoints
  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin/')

  if (isAdminRoute && payload.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden: Administrator access required.',
        },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Inject user info into request headers for downstream handlers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', String(payload.id))
  requestHeaders.set('x-user-role', payload.role)
  requestHeaders.set('x-user-email', payload.email)
  requestHeaders.set('x-user-name', payload.name)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
