import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase Auth invite API
export async function POST(request: NextRequest) {
  try {
    const { teamId, email, role = 'member' } = await request.json();

    if (!teamId || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing teamId or email' },
        { status: 400 }
      );
    }

    // Create admin client with service key (server-side only)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase service key not configured' },
        { status: 500 }
      );
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Send Supabase auth invite
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        team_id: teamId,
        role: role,
        invited_at: new Date().toISOString(),
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite&team_id=${teamId}&role=${role}`
    });

    if (error) {
      console.error('❌ Supabase auth invite error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log('✅ Supabase auth invite sent successfully:', data);
    return NextResponse.json({
      success: true,
      emailSent: true,
      method: 'supabase-auth'
    });

  } catch (error) {
    console.error('🔥 Supabase invite API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send invite' },
      { status: 500 }
    );
  }
}
