import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, access_token, refresh_token } = body;

    // Validate input
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // If tokens are provided, set the session first
    if (access_token && refresh_token) {
      try {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          return NextResponse.json(
            { error: 'Invalid or expired reset link' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error setting session:', error);
        return NextResponse.json(
          { error: 'Invalid or expired reset link' },
          { status: 400 }
        );
      }
    } else {
      // Check if user has valid session from auth header
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized - no valid session found' },
          { status: 401 }
        );
      }

      // Verify the token
      const { error: userError } = await supabase.auth.getUser(token);
      if (userError) {
        return NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401 }
        );
      }
    }

    // Update the user's password
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
