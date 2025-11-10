import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';

export default async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Handle admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    // Allow access to login page
    if (req.nextUrl.pathname === "/admin/login") {
      return res;
    }

    // Check for admin authentication cookie
    const adminAuth = req.cookies.get("admin-auth");

    if (!adminAuth) {
      // Redirect to admin login if not authenticated
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    try {
      const { email, timestamp } = JSON.parse(adminAuth.value);
      const isExpired = Date.now() - timestamp > 4 * 60 * 60 * 1000; // 4 hours

      if (isExpired) {
        // Redirect to admin login if session expired
        const response = NextResponse.redirect(new URL("/admin/login", req.url));
        response.cookies.delete("admin-auth");
        return response;
      }
    } catch {
      // Redirect to admin login if cookie is invalid
      const response = NextResponse.redirect(new URL("/admin/login", req.url));
      response.cookies.delete("admin-auth");
      return response;
    }

    return res;
  }

  // Handle protected routes (dashboard, proposals, etc.)
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return res;
  }

  // Create Supabase client for session management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check authentication and refresh session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("returnUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, allow access with refreshed session cookies
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
