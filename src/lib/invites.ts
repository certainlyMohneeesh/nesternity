// Team invites module using the new API architecture

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  teamId: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export async function createTeamInvite(
  teamId: string,
  email: string,
  role: string = 'member'
): Promise<{ success: boolean; error?: string; invite?: PendingInvite }> {
  try {
    const response = await fetch('/api/teams/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, email, role })
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, invite: data.invite };
    } else {
      return { success: false, error: data.error || 'Failed to create invite' };
    }
  } catch (error) {
    console.error('Create team invite error:', error);
    return { success: false, error: 'Failed to create invite' };
  }
}

export async function getTeamInvites(teamId: string): Promise<{
  success: boolean;
  invites?: PendingInvite[];
  error?: string;
}> {
  try {
    const response = await fetch(`/api/teams/invites?teamId=${teamId}`);
    const data = await response.json();

    if (response.ok) {
      return { success: true, invites: data.invites || [] };
    } else {
      return { success: false, error: data.error || 'Failed to fetch invites' };
    }
  } catch (error) {
    console.error('Get team invites error:', error);
    return { success: false, error: 'Failed to fetch invites' };
  }
}

export async function cancelInvite(inviteId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch('/api/teams/invites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId })
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.error || 'Failed to cancel invite' };
    }
  } catch (error) {
    console.error('Cancel invite error:', error);
    return { success: false, error: 'Failed to cancel invite' };
  }
}
