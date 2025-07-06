import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations, regular client for user operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, access_token, refresh_token } = body;

    console.log('Reset password request received');

    // Validate input
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Enhanced password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check for password complexity (optional)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    // If tokens are provided, set the session first
    if (access_token && refresh_token) {
      try {
        console.log('Setting session with provided tokens');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          return NextResponse.json(
            { error: 'Invalid or expired reset link. Please request a new password reset.' },
            { status: 400 }
          );
        }

        console.log('Session set successfully for user:', sessionData.user?.email);
      } catch (error) {
        console.error('Error setting session:', error);
        return NextResponse.json(
          { error: 'Invalid or expired reset link. Please request a new password reset.' },
          { status: 400 }
        );
      }
    } else {
      // Check if user has valid session from auth header
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized - no valid session found. Please use the reset link from your email.' },
          { status: 401 }
        );
      }

      // Verify the token
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) {
        console.error('Token verification error:', userError);
        return NextResponse.json(
          { error: 'Invalid or expired session. Please request a new password reset.' },
          { status: 401 }
        );
      }

      console.log('Valid session found for user:', userData.user.email);
    }

    // Update the user's password
    console.log('Attempting to update password');
    const { data: updateData, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update password' },
        { status: 400 }
      );
    }

    console.log('Password updated successfully for user:', updateData.user?.email);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
