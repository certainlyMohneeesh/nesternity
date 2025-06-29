import { supabase } from './supabase';
import crypto from 'crypto';

export interface PendingInvite {
  id: string;
  team_id: string;
  email: string;
  invited_by: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
  used_at?: string;
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createTeamInvite(
  teamId: string,
  email: string,
  role: string = 'member'
): Promise<{ success: boolean; error?: string; invite?: PendingInvite }> {
  try {
    // Check if user is already registered
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { success: false, error: 'User is already registered. Use the direct invite feature instead.' };
    }

    // Check if invite already exists
    const { data: existingInvite } = await supabase
      .from('team_invites')
      .select('*')
      .eq('team_id', teamId)
      .eq('email', email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      return { success: false, error: 'An active invite already exists for this email.' };
    }

    // Create new invite
    const token = generateInviteToken();
    const { data, error } = await supabase
      .from('team_invites')
      .insert([{
        team_id: teamId,
        email,
        role,
        token,
      }])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, invite: data };
  } catch (error) {
    return { success: false, error: 'Failed to create invite' };
  }
}

export async function getTeamInvites(teamId: string): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from('team_invites')
    .select('*')
    .eq('team_id', teamId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching team invites:', error);
    return [];
  }

  return data || [];
}

export async function cancelInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('team_invites')
    .delete()
    .eq('id', inviteId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function acceptInvite(token: string): Promise<{ success: boolean; error?: string; teamId?: string }> {
  const { data, error } = await supabase.rpc('accept_team_invite', { invite_token: token });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.success) {
    return { success: false, error: data.error };
  }

  return { success: true, teamId: data.team_id };
}

// Email service placeholder - in a real app, you'd integrate with services like:
// - Resend, SendGrid, AWS SES, etc.
export async function sendInviteEmail(
  email: string,
  teamName: string,
  inviterName: string,
  inviteToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // This is a placeholder - implement actual email sending
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`;
    
    console.log(`
      =================================
      INVITE EMAIL (Development Mode)
      =================================
      To: ${email}
      Subject: You've been invited to join ${teamName}
      
      Hi there!
      
      ${inviterName} has invited you to join the team "${teamName}" on Nesternity.
      
      Click here to accept the invite: ${inviteUrl}
      
      This invite will expire in 7 days.
      
      =================================
    `);

    // In production, replace this with actual email sending:
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: email,
    //     subject: `You've been invited to join ${teamName}`,
    //     html: `<p>You've been invited to join ${teamName}. <a href="${inviteUrl}">Accept invite</a></p>`
    //   })
    // });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to send invite email' };
  }
}
