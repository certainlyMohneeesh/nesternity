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
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    });

    if (error) {
      console.error('❌ Register API: Supabase auth error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Register API: User registered successfully in Supabase');

    // If user was created and has a session, sync to database using sync-user endpoint
    if (data.user && data.session) {
      try {
        console.log('🔄 Register API: Syncing user to database via sync-user API');
        
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sync-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (syncResponse.ok) {
          console.log('✅ Register API: User synced successfully to database');
        } else {
          console.warn('⚠️ Register API: Failed to sync user to database via API');
          // Fallback: create user record directly
          try {
            await db.user.create({
              data: {
                id: data.user.id,
                email: data.user.email!,
                displayName: displayName,
              }
            });
            console.log('✅ Register API: User record created directly in database');
          } catch (dbError: any) {
            console.warn('⚠️ Register API: Failed to create user in database:', dbError);
          }
        }
        
      } catch (syncError) {
        console.warn('⚠️ Register API: Failed to sync user via API:', syncError);
        // Fallback: create user record directly without team setup
        try {
          await db.user.create({
            data: {
              id: data.user.id,
              email: data.user.email!,
              displayName: displayName,
            }
          });
          console.log('✅ Register API: User record created directly in database (fallback)');
        } catch (dbError: any) {
          console.warn('⚠️ Register API: Failed to create user in database:', dbError);
        }
      }
    } else if (data.user) {
      // User created but no session (email confirmation required)
      // Create basic user record without team setup
      try {
        console.log('🔄 Register API: Creating basic user record (email confirmation pending)');
        
                // Check for orphaned user with same email
        const orphanedUser = await db.user.findUnique({
          where: { email: data.user.email! },
          include: {
            _count: {
              select: {
                ownedTeams: true,
                teamMembers: true,
              }
            }
          }
        });
        
        if (orphanedUser) {
          // Only delete if no teams or memberships
          if (orphanedUser._count.ownedTeams === 0 && orphanedUser._count.teamMembers === 0) {
            console.log('🗑️ Register API: Deleting orphaned user:', orphanedUser.email);
            await db.user.delete({
              where: { id: orphanedUser.id }
            });
          } else {
            console.warn('⚠️ Register API: Orphaned user has data, not deleting');
            // Continue anyway - user will be created with new ID
          }
        }
        
        await db.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            displayName: displayName,
          }
        });
        
        console.log('✅ Register API: Basic user record created in database');
      } catch (dbError: any) {
        console.warn('⚠️ Register API: Failed to create user in database:', dbError);
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
