import { NextRequest, NextResponse } from 'next/server';
import { sendTeamInviteEmail } from '@/lib/email';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteToken } = body;

    if (!inviteToken) {
      return NextResponse.json(
        { success: false, error: 'Invite token is required' },
        { status: 400 }
      );
    }

    // Get invite details using secure function
    const { data: inviteResult, error: inviteError } = await supabase.rpc('get_invite_details_secure', {
      p_token: inviteToken
    });

    if (inviteError || !inviteResult?.success) {
      console.error('Failed to get invite details:', inviteError || inviteResult?.error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invite' },
        { status: 404 }
      );
    }

    const invite = inviteResult.invite;
    
    // Check if invite is still valid
    if (invite.used_at || new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invite is expired or already used' },
        { status: 400 }
      );
    }
    
    // Prepare email data
    const emailData = {
      recipientEmail: invite.email,
      teamName: invite.team_name || 'Unknown Team',
      inviterName: invite.inviter_name || 'Team Admin',
      inviteToken: inviteToken,
      expiresAt: invite.expires_at,
    };

    // Send email
    const emailResult = await sendTeamInviteEmail(emailData);

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation email sent successfully'
    });

  } catch (error) {
    console.error('❌ Send invite email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
