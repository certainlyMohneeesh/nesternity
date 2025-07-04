import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Attempt to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Login failed - no session created' },
        { status: 401 }
      );
    }

    // Sync user to Prisma database
    try {
      const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!syncResponse.ok) {
        console.warn('Failed to sync user to database:', await syncResponse.text());
      }
    } catch (syncError) {
      console.warn('User sync error:', syncError);
      // Don't fail the login if sync fails
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
