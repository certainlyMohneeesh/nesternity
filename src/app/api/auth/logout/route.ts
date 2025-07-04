import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Sign out from Supabase
    if (token) {
      try {
        // Use the token to sign out the specific session
        const { error } = await supabase.auth.admin.signOut(token);
        if (error) {
          console.warn('Supabase logout error:', error);
        }
      } catch (error) {
        console.warn('Error during Supabase logout:', error);
      }
    } else {
      // Fallback: general sign out
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.warn('Error during general Supabase logout:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for simple logout links
export async function GET() {
  try {
    await supabase.auth.signOut();
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
