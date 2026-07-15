import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — allow
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/v1') || pathname === '/api/users/register' || pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get('PROJECT_OS_ACCESS')?.value || req.cookies.get('PROJECT_OS_REFRESH')?.value;

  // No session → redirect to login
  if (!sessionToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
