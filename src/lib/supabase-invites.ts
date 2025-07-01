import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

// Create admin client for auth operations (requires service key)
const getAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found - Supabase auth invites will not work');
    return null;
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// Supabase Auth-based invite system (FREE and built-in)
export async function createSupabaseInvite(
  teamId: string,
  email: string,
  role: string = 'member'
): Promise<{ success: boolean; error?: string; emailSent?: boolean }> {
  try {
    console.log('🔍 Creating Supabase auth invite:', { teamId, email, role });

    const adminClient = getAdminClient();
    if (!adminClient) {
      return { 
        success: false, 
        error: 'Supabase service key not configured. Add SUPABASE_SERVICE_ROLE_KEY to your environment variables.',
        emailSent: false 
      };
    }

    // Use Supabase's built-in invite system
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        team_id: teamId,
        role: role,
        invited_at: new Date().toISOString(),
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?type=invite&team_id=${teamId}&role=${role}`
    });

    if (error) {
      console.error('❌ Supabase invite error:', error);
      return { 
        success: false, 
        error: error.message,
        emailSent: false 
      };
    }

    console.log('✅ Supabase invite sent successfully:', data);

    // Store the invite in our custom table for tracking (optional)
    try {
      const { error: trackingError } = await supabase
        .from('team_invites')
        .insert({
          team_id: teamId,
          email: email,
          role: role,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          token: data.user?.id || 'supabase-auth-invite',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      if (trackingError) {
        console.warn('⚠️ Failed to track invite in custom table:', trackingError);
        // Don't fail the whole operation
      }
    } catch (trackingErr) {
      console.warn('⚠️ Invite tracking error:', trackingErr);
    }

    return { 
      success: true, 
      emailSent: true 
    };

  } catch (error) {
    console.error('🔥 Unexpected Supabase invite error:', error);
    return { 
      success: false, 
      error: 'Failed to send invite',
      emailSent: false 
    };
  }
}

// Handle the callback when user accepts invite
export async function handleSupabaseInviteCallback(
  teamId: string,
  role: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_users')
      .insert({
        team_id: teamId,
        user_id: user.id,
        role: role,
        accepted_at: new Date().toISOString(),
        added_by: user.id // Self-added via invite
      });

    if (memberError) {
      console.error('❌ Failed to add user to team:', memberError);
      return { success: false, error: 'Failed to join team' };
    }

    // Mark invite as used in our tracking table
    await supabase
      .from('team_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('team_id', teamId)
      .eq('email', userEmail);

    console.log('✅ User successfully added to team via Supabase invite');
    return { success: true };

  } catch (error) {
    console.error('🔥 Invite callback error:', error);
    return { success: false, error: 'Failed to process invite' };
  }
}

// Check if user has admin access to use auth.admin functions
export async function hasAdminAccess(): Promise<boolean> {
  try {
    const adminClient = getAdminClient();
    if (!adminClient) return false;
    
    // Try to call an admin function to test access
    const { error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  } catch {
    return false;
  }
}

// Hybrid approach: Try Supabase first, fallback to custom
export async function createTeamInviteHybrid(
  teamId: string,
  email: string,
  role: string = 'member'
): Promise<{ success: boolean; error?: string; emailSent?: boolean; method?: string }> {
  
  // Check if we have admin access for Supabase auth
  const hasAdmin = await hasAdminAccess();
  
  if (hasAdmin) {
    console.log('🎯 Using Supabase Auth invite (FREE)');
    const result = await createSupabaseInvite(teamId, email, role);
    return { ...result, method: 'supabase-auth' };
  } else {
    console.log('🔄 Fallback to custom invite system');
    // Import and use your existing function
    const { createTeamInvite } = await import('./invites');
    const result = await createTeamInvite(teamId, email, role, true);
    return { ...result, method: 'custom-resend' };
  }
}
