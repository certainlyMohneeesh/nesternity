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
  matcher: ["/dashboard/:path*"],
};
