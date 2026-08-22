import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, images, api routes, and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Public auth paths
  const isAuthPath = pathname === '/sign-in' || pathname === '/sign-up';
  
  // Get mock or real session cookie/token
  const sessionCookie = request.cookies.get('hrms_session')?.value || request.cookies.get('sb-access-token')?.value;
  const userRole = request.cookies.get('hrms_user_role')?.value || 'EMPLOYEE';

  // Unauthenticated user attempting to access protected route
  if (!sessionCookie && !isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to access sign-in / sign-up
  if (sessionCookie && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Admin-only paths restriction
  const isAdminPath = pathname.startsWith('/employees/new');
  if (sessionCookie && isAdminPath && userRole !== 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = '/employees';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
