import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Register API: Starting registration request');
    
    const { email, password, displayName } = await request.json();
    
    // Validate input
    if (!email || !password || !displayName) {
      console.log('❌ Register API: Missing required fields');
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      console.log('❌ Register API: Password too short');
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    console.log('🔄 Register API: Attempting to register user with email:', email);

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          displayName,
          display_name: displayName // Supabase uses both formats
        }
      }
    });

    if (error) {
      console.error('❌ Register API: Supabase auth error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Register API: User registered successfully in Supabase');

    // If user was created, also create user record in our database
    if (data.user) {
      try {
        console.log('🔄 Register API: Creating user record in database');
        
        await db.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            displayName: displayName,
          }
        });
        
        console.log('✅ Register API: User record created in database');
      } catch (dbError: any) {
        console.warn('⚠️ Register API: Failed to create user in database:', dbError);
        // Don't fail the registration if database creation fails
        // The user is still created in Supabase Auth
      }
    }

    return NextResponse.json({
      message: 'Registration successful! Please check your email to confirm your account.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        displayName: displayName
      }
    });

  } catch (err: any) {
    console.error('❌ Register API: Unexpected error:', err);
    return NextResponse.json({ 
      error: err.message || 'Registration failed. Please try again' 
    }, { status: 500 });
  }
}
