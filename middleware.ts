import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Feature Flag Middleware
 * 
 * This middleware checks if routes should be hidden based on demo mode settings.
 * Hidden routes redirect to the home page.
 * 
 * Note: We duplicate the DEMO_MODE and HIDDEN_ROUTES here because middleware
 * runs in Edge Runtime and can't import from client-side modules.
 */

// Demo mode - when true, hides experimental/secondary features
const DEMO_MODE = true

// Routes to hide in demo mode
const HIDDEN_ROUTES = DEMO_MODE ? [
  '/communities',
  '/leaderboard',
  '/collaborate',
  '/learning-paths',
  '/review',
  '/study-guides',
  '/code-review',
  '/admin',
  '/pricing',
] : []

function isRouteHidden(pathname: string): boolean {
  return HIDDEN_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route should be hidden
  if (isRouteHidden(pathname)) {
    // Redirect to home page
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
