import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase, createSupabaseServerClient } from '@/lib/supabase';

// Get current user profile or create if doesn't exist
export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists in our database
    let dbUser = await db.user.findUnique({
      where: { id: user.id }
    });

    // Create user if doesn't exist
    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          id: user.id,
          email: user.email!,
          displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        }
      });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, avatarUrl } = body;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        displayName,
        avatarUrl,
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete user account and associated data
export async function DELETE(request: NextRequest) {
  try {
    // Token from headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user from our database (cascades will handle related data)
    await db.user.delete({ where: { id: user.id } });

    // Delete user from Supabase Auth as well using service role key
    try {
      // admin client using service role key
      const adminClient = createSupabaseServerClient();
      if (adminClient?.auth?.admin) {
        await adminClient.auth.admin.deleteUser(user.id);
      }
    } catch (adminErr) {
      console.warn('Could not delete Supabase auth user via admin client:', adminErr);
      // Not failing hard — we already removed DB user
    }

    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
