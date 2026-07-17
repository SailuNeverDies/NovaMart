import authConfig from './auth.config';
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === 'ADMIN';

  // Protected admin routes — admins only
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  const isAdminApiRoute = nextUrl.pathname.startsWith('/api/admin');

  if (isAdminRoute || isAdminApiRoute) {
    if (!isLoggedIn) {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${nextUrl.pathname}`, nextUrl));
    }
    if (!isAdmin) {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', nextUrl));
    }
  }

  // Protected account routes — logged in users
  if (nextUrl.pathname.startsWith('/account')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${nextUrl.pathname}`, nextUrl)
      );
    }
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && nextUrl.pathname.startsWith('/auth/signin')) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/account/:path*',
    '/auth/signin',
  ],
};
