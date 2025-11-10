import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/proposals') ||
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
