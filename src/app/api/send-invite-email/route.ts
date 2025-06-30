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

    // Get invite details from database
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .select(`
        id, team_id, email, token, expires_at, created_at,
        teams:team_id (id, name),
        inviter:invited_by (display_name, email)
      `)
      .eq('token', inviteToken)
      .eq('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invite' },
        { status: 404 }
      );
    }

    // Prepare email data
    const team = Array.isArray(invite.teams) ? invite.teams[0] : invite.teams;
    const inviter = Array.isArray(invite.inviter) ? invite.inviter[0] : invite.inviter;
    
    const emailData = {
      recipientEmail: invite.email,
      teamName: team?.name || 'Unknown Team',
      inviterName: inviter?.display_name || inviter?.email || 'Team Admin',
      inviteToken: invite.token,
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
