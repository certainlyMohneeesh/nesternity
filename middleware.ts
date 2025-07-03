import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function getUserFromToken(token: string) {
  // Use Supabase REST endpoint for user info (works in Edge runtime)
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    // Allow access to login page
    if (req.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
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
  }

  if (!req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token) {
    return NextResponse.redirect(new URL("/auth/register", req.url));
  }

  const user = await getUserFromToken(access_token);
  if (!user) {
    return NextResponse.redirect(new URL("/auth/register", req.url));
  }

  // User is authenticated, allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
