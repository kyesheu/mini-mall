import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const AUTH_COOKIE = 'token'

// JWT_SECRET is required — no default value
const secret = process.env.JWT_SECRET
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET = new TextEncoder().encode(secret)

// Paths that don't require authentication
const PUBLIC_PREFIXES = [
  '/',
  '/products',
  '/categories',
  '/search',
  '/auth/login',
  '/auth/register',
  '/_next',
  '/favicon.ico',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith('/_next'),
  )
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

/** Unauthenticated: redirect to login page */
function unauthorized(request: NextRequest) {
  return NextResponse.redirect(new URL('/auth/login', request.url))
}

/** Invalid/expired token: clear cookie and redirect */
function invalidToken(request: NextRequest) {
  const res = NextResponse.redirect(new URL('/auth/login', request.url))
  res.cookies.delete(AUTH_COOKIE)
  return res
}

/** Inject user info headers for downstream use (logging only, NOT for auth decisions) */
function injectUserHeaders(request: NextRequest, userId: number, role: string) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', String(userId))
  requestHeaders.set('x-user-role', role)
  return requestHeaders
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths — allow through
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value

  // ============================================================
  // Admin paths: need token + ADMIN role
  // ============================================================
  if (isAdminPath(pathname)) {
    if (!token) return unauthorized(request)

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      if (payload.role !== 'ADMIN') {
        // Authenticated but not admin → redirect to home
        return NextResponse.redirect(new URL('/', request.url))
      }
      return NextResponse.next({
        request: {
          headers: injectUserHeaders(request, Number(payload.sub), String(payload.role)),
        },
      })
    } catch {
      return invalidToken(request)
    }
  }

  // ============================================================
  // Protected paths: /cart, /orders — need token
  // ============================================================
  if (!token) return unauthorized(request)

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return NextResponse.next({
      request: {
        headers: injectUserHeaders(request, Number(payload.sub), String(payload.role)),
      },
    })
  } catch {
    return invalidToken(request)
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/cart/:path*',
    '/orders/:path*',
  ],
}
