import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Security Headers for SEO and Trust Signals
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Cache Control Headers for Performance
  const cachePathname = request.nextUrl.pathname;

  // Static assets - cache for 1 year
  if (cachePathname.match(/\.(woff2|woff|ttf|svg|gif|webp|png|jpg|jpeg|ico)$/i)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // HTML pages - cache for 1 day with revalidation
  if (cachePathname.endsWith('.html') || cachePathname === '/') {
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  }

  // API routes - cache for 1 hour
  if (cachePathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600');
  }

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // Log authentication status for debugging
  console.log('🔐 Middleware Auth Check:', {
    path: request.nextUrl.pathname,
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
  });

  // Phase 7: Route Redirects - Organisation-Centric Architecture
  // Redirect old routes to new organisation-centric structure
  const pathname = request.nextUrl.pathname;

  // Redirect /dashboard/clients -> /dashboard/organisation?tab=clients
  if (pathname === '/dashboard/clients') {
    const newUrl = new URL('/dashboard/organisation', request.url);
    newUrl.searchParams.set('tab', 'clients');
    console.log('🔄 Redirecting /dashboard/clients -> /dashboard/organisation?tab=clients');
    return NextResponse.redirect(newUrl);
  }

  // Redirect /dashboard/projects -> /dashboard/organisation
  if (pathname === '/dashboard/projects') {
    const newUrl = new URL('/dashboard/organisation', request.url);
    console.log('🔄 Redirecting /dashboard/projects -> /dashboard/organisation');
    return NextResponse.redirect(newUrl);
  }

  // Redirect /dashboard/clients/[id] -> /dashboard/organisation/[id]
  const clientIdMatch = pathname.match(/^\/dashboard\/clients\/([^\/]+)$/);
  if (clientIdMatch) {
    const clientId = clientIdMatch[1];
    const newUrl = new URL(`/dashboard/organisation/${clientId}`, request.url);
    console.log(`🔄 Redirecting /dashboard/clients/${clientId} -> /dashboard/organisation/${clientId}`);
    return NextResponse.redirect(newUrl);
  }

  // Protect dashboard routes
  const isPublicProposalRoute = request.nextUrl.pathname.match(/^\/proposals\/[^/]+\/sign$/);

  if ((request.nextUrl.pathname.startsWith('/proposals') && !isPublicProposalRoute) ||
    request.nextUrl.pathname.startsWith('/clients') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/boards') ||
    request.nextUrl.pathname.startsWith('/teams') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname === '/dashboard') {

    if (!user) {
      console.log('❌ No user found, redirecting to login');
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('✅ User authenticated:', user.email);
  }

  // Only protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isAuthenticated = request.cookies.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      console.log('❌ Admin not authenticated, redirecting to admin login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/proposals/:path*',
    '/clients/:path*',
    '/projects/:path*',
    '/boards/:path*',
    '/teams/:path*',
    '/settings/:path*',
    '/dashboard',
    '/admin/:path*',
  ]
};
