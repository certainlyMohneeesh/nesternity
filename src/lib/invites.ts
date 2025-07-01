import { supabase } from './supabase';
import crypto from 'crypto';

// Diagnostic function to test if functions exist
export async function testFunctionExists(): Promise<{[key: string]: boolean}> {
  const functions = [
    'get_team_invites_secure',
    'create_team_invite_secure', 
    'cancel_team_invite_secure',
    'add_team_member',
    'get_user_teams_ultimate'
  ];
  
  const results: {[key: string]: boolean} = {};
  
  for (const funcName of functions) {
    try {
      // Try to call with invalid params to see if function exists
      const { error } = await supabase.rpc(funcName, {});
      
      // If we get a 42883 error, function doesn't exist
      if (error?.code === '42883') {
        results[funcName] = false;
        console.log(`❌ Function ${funcName} does NOT exist`);
      } else {
        results[funcName] = true;  
        console.log(`✅ Function ${funcName} exists`);
      }
    } catch (e) {
      results[funcName] = false;
      console.log(`❌ Function ${funcName} test failed:`, e);
    }
  }
  
  return results;
}

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
  role: string = 'member',
  sendEmail: boolean = true
): Promise<{ success: boolean; error?: string; invite?: PendingInvite; emailSent?: boolean; emailMethod?: string }> {
  try {
    console.log('🔍 Attempting to create team invite:', { teamId, email, role, sendEmail });
    
    // Import email configuration
    const { EMAIL_PROVIDER } = await import('./email-config');
    
    // Handle different email providers
    if (sendEmail && EMAIL_PROVIDER === 'supabase-auth') {
      console.log('🎯 Using Supabase Auth invite system (FREE)');
      const { createSupabaseInvite } = await import('./supabase-invites');
      return { ...(await createSupabaseInvite(teamId, email, role)), emailMethod: 'supabase-auth' };
    }
    
    if (sendEmail && EMAIL_PROVIDER === 'hybrid') {
      console.log('🔄 Using hybrid email system');
      const { createTeamInviteHybrid } = await import('./supabase-invites');  
      return await createTeamInviteHybrid(teamId, email, role);
    }
    
    // Default to custom invite system with Resend (original behavior)
    
    // Use the secure function instead of direct table access
    const { data, error } = await supabase.rpc('create_team_invite_secure', {
      p_team_id: teamId,
      p_email: email,
      p_role: role
    });

    console.log('📊 Create invite response:', { data, error });

    if (error) {
      console.error('❌ Function error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        return { success: false, error: 'Database functions not set up. Please run the ultimate_recursion_fix.sql script.' };
      }
      
      return { success: false, error: error.message };
    }

    if (!data || !data.success) {
      console.log('❌ Function returned failure:', data);
      
      // Handle specific error cases
      if (data?.error?.includes('encoding')) {
        console.error('Database encoding error - running SQL fix required');
        return { success: false, error: 'Database configuration error. Please contact support.' };
      }
      
      return { success: false, error: data?.error || 'Failed to create invite' };
    }

    console.log('✅ Successfully created invite');
    
    let emailSent = false;
    
    // Send email if requested (Resend method)
    if (sendEmail) {
      try {
        console.log('📧 Attempting to send invite email via Resend...');
        const emailResponse = await fetch('/api/send-invite-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inviteToken: data.token
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          console.log('✅ Email sent successfully via Resend');
          emailSent = true;
        } else {
          console.warn('⚠️ Email sending failed:', emailResult.error);
          // Don't fail the whole operation if email fails
        }
      } catch (emailError) {
        console.warn('⚠️ Email sending error:', emailError);
        // Don't fail the whole operation if email fails
      }
    }
    
    // Return in expected format
    return { 
      success: true,
      emailSent,
      emailMethod: 'resend',
      invite: {
        id: '', // Not returned by function
        team_id: teamId,
        email,
        invited_by: '', // Not needed for response
        role,
        token: data.token,
        expires_at: data.expires_at,
        created_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('🔥 Unexpected error creating invite:', error);
    return { success: false, error: 'Failed to create invite' };
  }
}

export async function getTeamInvites(teamId: string): Promise<PendingInvite[]> {
  try {
    console.log('🔍 Attempting to get team invites for:', teamId);
    
    // Use the secure function instead of direct table access
    const { data, error } = await supabase.rpc('get_team_invites_secure', {
      team_uuid: teamId
    });

    console.log('📊 Function response:', { data, error });
    console.log('📊 Full error object:', JSON.stringify(error, null, 2));

    if (error) {
      console.error('❌ Function error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      
      // Check for function existence error
      if (error.code === '42883' || (error.message && error.message.includes('function') && error.message.includes('does not exist'))) {
        console.error('🚫 Function get_team_invites_secure does not exist - please run the ultimate_recursion_fix.sql script');
        throw new Error('Database functions not set up. Please run the ultimate_recursion_fix.sql script.');
      }
      
      // Handle specific error cases
      if (error.message?.includes('Access denied')) {
        console.log('🔒 Access denied to team invites - user is not team creator');
        return [];
      }
      
      if (error.message?.includes('infinite recursion')) {
        console.error('♻️ Database recursion error - please run the ultimate_recursion_fix.sql script');
        throw new Error('Database recursion detected. Please run the ultimate_recursion_fix.sql script.');
      }
      
      console.error('💥 Error fetching team invites:', error);
      throw new Error(`Failed to fetch team invites: ${error.message || 'Unknown error'}`);
    }

    console.log('✅ Successfully fetched invites:', data);
    return data || [];
  } catch (error) {
    console.error('🔥 Unexpected error fetching team invites:', error);
    // Re-throw the error so it can be handled by the calling component
    throw error;
  }
}

export async function cancelInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use the secure function with explicit parameters to avoid ambiguity
    const { data, error } = await supabase.rpc('cancel_team_invite_secure', {
      p_invite_id: inviteId
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || !data.success) {
      return { success: false, error: data?.error || 'Failed to cancel invite' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to cancel invite' };
  }
}

export async function acceptInvite(token: string): Promise<{ success: boolean; error?: string; teamId?: string }> {
  try {
    const { data, error } = await supabase.rpc('accept_team_invite_secure', { 
      p_token: token 
    });

    if (error) {
      console.error('Accept invite error:', error);
      return { success: false, error: error.message };
    }

    if (!data || !data.success) {
      return { success: false, error: data?.error || 'Failed to accept invite' };
    }

    return { success: true, teamId: data.team_id };
  } catch (error) {
    console.error('Unexpected accept invite error:', error);
    return { success: false, error: 'Failed to accept invite' };
  }
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
