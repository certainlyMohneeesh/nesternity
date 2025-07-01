import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createActivity, ACTIVITY_TYPES } from "@/lib/notifications";
import { getTeamInvites, PendingInvite } from "@/lib/invites";
import { Trash2, Copy, Crown, UserMinus, RefreshCw } from "lucide-react";
import { useSession } from "@/components/auth/session-context";
import InviteMembers from "./invite-members";

interface TeamUser {
  id: string;
  user_id: string;
  role: string;
  accepted_at: string;
  users?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface TeamMembersProps {
  teamId: string;
  teamName: string;
  teamCreatedBy: string;
  onMemberChange?: () => void;
}

export default function TeamMembers({ teamId, teamName, teamCreatedBy, onMemberChange }: TeamMembersProps) {
  const { session } = useSession();
  const userId = session?.user.id;
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentUserMember = members.find(m => m.user_id === userId);
  const isAdmin = currentUserMember?.role === "admin" || teamCreatedBy === userId;
  const isCreator = teamCreatedBy === userId;

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  async function fetchMembers() {
    setLoading(true);
    
    try {
      // Fetch members with user details
      const { data: memberData, error: memberError } = await supabase
        .from("team_users")
        .select(`
          id, user_id, role, accepted_at,
          users:user_id (id, email, display_name, avatar_url)
        `)
        .eq("team_id", teamId)
        .order('role', { ascending: false }); // Show admins first

      if (memberError) {
        console.error("Error fetching members:", memberError);
      } else {
        setMembers((memberData || []).map((row: any) => ({
          ...row,
          users: Array.isArray(row.users) ? row.users[0] : row.users
        })));
      }
      
      // Fetch pending invites if user is admin
      if (isAdmin) {
        const invites = await getTeamInvites(teamId);
        setPendingInvites(invites.invites || []);
      }
      
    } catch (error) {
      console.error("Error in fetchMembers:", error);
    }
    
    setLoading(false);
  }

  async function handleRemoveMember(user_id: string) {
    if (!isAdmin || user_id === userId) return;
    
    const memberToRemove = members.find(m => m.user_id === user_id);
    if (!memberToRemove) return;

    setActionLoading(user_id);
    
    try {
      const { error } = await supabase
        .from("team_users")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", user_id);
      
      if (!error) {
        // Create activity for member removal
        const memberName = memberToRemove.users?.display_name || memberToRemove.users?.email || 'Unknown user';
        await createActivity(
          teamId,
          ACTIVITY_TYPES.MEMBER_REMOVED,
          `Member removed: ${memberName}`,
          `${memberName} was removed from the team`
        );
        
        await fetchMembers();
        if (onMemberChange) onMemberChange();
      } else {
        console.error("Error removing member:", error);
        alert("Failed to remove member: " + error.message);
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("An error occurred while removing the member.");
    }
    
    setActionLoading(null);
  }

  async function handleChangeRole(user_id: string, newRole: string) {
    if (!isCreator || user_id === userId) return;
    
    setActionLoading(user_id);
    
    try {
      const { error } = await supabase
        .from("team_users")
        .update({ role: newRole })
        .eq("team_id", teamId)
        .eq("user_id", user_id);
      
      if (!error) {
        const member = members.find(m => m.user_id === user_id);
        const memberName = member?.users?.display_name || member?.users?.email || 'Unknown user';
        
        await createActivity(
          teamId,
          ACTIVITY_TYPES.MEMBER_ADDED, // We can reuse this or create a new ROLE_CHANGED type
          `Role updated: ${memberName}`,
          `${memberName}'s role was changed to ${newRole}`
        );
        
        await fetchMembers();
        if (onMemberChange) onMemberChange();
      } else {
        console.error("Error changing role:", error);
        alert("Failed to change role: " + error.message);
      }
    } catch (error) {
      console.error("Error changing role:", error);
      alert("An error occurred while changing the role.");
    }
    
    setActionLoading(null);
  }

  function getMemberInitials(member: TeamUser): string {
    const name = member.users?.display_name || member.users?.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  }

  function getRoleColor(role: string): "default" | "secondary" | "destructive" | "outline" {
    switch (role) {
      case 'admin': return 'default';
      case 'member': return 'secondary';
      default: return 'outline';
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading members...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Members Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Team Members ({members.length})</h3>
            <p className="text-sm text-muted-foreground">
              Manage who has access to this team
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMembers}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {isAdmin && (
              <InviteMembers 
                teamId={teamId} 
                teamName={teamName}
                onMemberAdded={() => {
                  fetchMembers();
                  if (onMemberChange) onMemberChange();
                }}
              />
            )}
          </div>
        </div>

        <div className="space-y-3">
          {members.map(member => (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.users?.avatar_url} />
                  <AvatarFallback>{getMemberInitials(member)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {member.users?.display_name || member.users?.email || member.user_id}
                    {member.user_id === teamCreatedBy && (
                      <span title="Team Creator">
                        <Crown className="h-4 w-4 text-yellow-500" />
                      </span>
                    )}
                  </div>
                  {member.users?.email && member.users?.display_name && (
                    <div className="text-sm text-muted-foreground">{member.users.email}</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(member.accepted_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={getRoleColor(member.role)}>
                  {member.role}
                </Badge>
                
                {/* Role change for creators */}
                {isCreator && member.user_id !== userId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChangeRole(
                      member.user_id, 
                      member.role === 'admin' ? 'member' : 'admin'
                    )}
                    disabled={actionLoading === member.user_id}
                  >
                    {member.role === 'admin' ? 'Make Member' : 'Make Admin'}
                  </Button>
                )}
                
                {/* Remove button for admins (can't remove themselves or creator) */}
                {isAdmin && member.user_id !== userId && member.user_id !== teamCreatedBy && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={actionLoading === member.user_id}
                  >
                    {actionLoading === member.user_id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserMinus className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Invites Section */}
      {isAdmin && pendingInvites.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            Pending Invites ({pendingInvites.length})
          </h3>
          <div className="space-y-2">
            {pendingInvites.map(invite => (
              <div 
                key={invite.id} 
                className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <div>
                  <div className="font-medium">{invite.email}</div>
                  <div className="text-sm text-muted-foreground">
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{invite.role}</Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const url = `${window.location.origin}/invite/${invite.id}`;
                      navigator.clipboard.writeText(url);
                      alert('Invite link copied to clipboard!');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
