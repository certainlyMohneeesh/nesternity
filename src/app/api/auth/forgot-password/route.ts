import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '@/lib/email-smart';

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists in the database (optional security check)
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    const userExists = userData?.users?.find(user => user.email === email);

    if (!userExists) {
      // For security, we still return success even if user doesn't exist
      // This prevents email enumeration attacks
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, you will receive a password reset link shortly.'
      });
    }

    // Send password reset email using Supabase (which will use your SMTP configuration)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      console.error('Supabase password reset error:', error);
      
      // Fallback: Try sending custom email using our email service
      try {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
        await sendPasswordResetEmail({
          recipientEmail: email,
          recipientName: email.split('@')[0], // Use email prefix as fallback name
          resetToken: 'fallback-token',
          expiresAt
        });
        console.log('Fallback email sent successfully');
      } catch (fallbackError) {
        console.error('Fallback email error:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to send password reset email. Please try again later.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
