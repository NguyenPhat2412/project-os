import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — allow
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Check session cookie (NextAuth v5 stores JWT in __Secure-next-auth.session-token)
  const sessionToken = req.cookies.get('__Secure-next-auth.session-token')?.value || req.cookies.get('next-auth.session-token')?.value;

  // No session → redirect to login
  if (!sessionToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
