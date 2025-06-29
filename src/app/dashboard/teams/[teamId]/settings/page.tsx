"use client";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/auth/session-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Crown, UserX, Settings } from "lucide-react";

interface TeamUser {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  accepted_at: string;
  users: {
    id: string;
    email: string;
    user_metadata?: any;
    display_name?: string;
  } | null;
}

interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export default function TeamSettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { session } = useSession();
  const userId = session?.user.id;
  const [team, setTeam] = useState<Team | null>(null);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>("");

  useEffect(() => {
    if (userId && teamId) {
      fetchTeamData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, teamId]);

  async function fetchTeamData() {
    setLoading(true);
    setError(null);
    
    // Fetch team data
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();
    
    if (teamError) {
      setError("Failed to load team data");
      setLoading(false);
      return;
    }
    
    setTeam(teamData);
    
    // Fetch team users with user details
    const { data, error } = await supabase
      .from("team_users")
      .select(`
        id, user_id, team_id, role, accepted_at,
        users:user_id (id, email, display_name)
      `)
      .eq("team_id", teamId);
      
    if (error) {
      setError("Failed to load team members");
      setLoading(false);
      return;
    }
    
    setTeamUsers((data || []).map((row: any) => ({ ...row, users: row.users ?? null })));
    
    // Check if current user is admin or owner
    const currentUserRole = data?.find((u: any) => u.user_id === userId);
    setIsAdmin(!!currentUserRole && (currentUserRole.role === "admin" || teamData?.created_by === userId));
    setLoading(false);
  }

  async function handleRoleChange(targetUserId: string, newRole: string) {
    const { error } = await supabase
      .from("team_users")
      .update({ role: newRole })
      .eq("team_id", teamId)
      .eq("user_id", targetUserId);
      
    if (error) {
      alert("Failed to update role: " + error.message);
      return;
    }
    
    await fetchTeamData();
  }

  async function handleRemoveMember(targetUserId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    const { error } = await supabase
      .from("team_users")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", targetUserId);
      
    if (error) {
      alert("Failed to remove member: " + error.message);
      return;
    }
    
    await fetchTeamData();
  }

  async function handleTransferOwnership() {
    if (!selectedNewOwner || !team) return;
    
    const { error } = await supabase
      .from("teams")
      .update({ created_by: selectedNewOwner })
      .eq("id", teamId);
      
    if (error) {
      alert("Failed to transfer ownership: " + error.message);
      return;
    }
    
    // Update the new owner's role to admin if they're not already
    await supabase
      .from("team_users")
      .update({ role: "admin" })
      .eq("team_id", teamId)
      .eq("user_id", selectedNewOwner);
    
    setTransferDialogOpen(false);
    setSelectedNewOwner("");
    await fetchTeamData();
  }

  async function handleDeleteTeam() {
    if (!confirm("Are you sure you want to delete this team? This cannot be undone.")) return;
    
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    
    if (error) {
      alert("Failed to delete team: " + error.message);
      return;
    }
    
    // Redirect after successful deletion
    window.location.href = "/dashboard/teams";
  }

  const isOwner = team?.created_by === userId;
  const eligibleNewOwners = teamUsers.filter(u => u.user_id !== userId && u.role === "admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Team Settings</h2>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-red-500 bg-red-50 p-4 rounded">{error}</div>
      ) : !isAdmin ? (
        <div className="text-yellow-600 bg-yellow-50 p-4 rounded">
          You must be a team admin to manage settings.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Team Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Team Information</h3>
            <div className="space-y-2">
              <div><strong>Name:</strong> {team?.name}</div>
              <div><strong>Created:</strong> {team?.created_at ? new Date(team.created_at).toLocaleDateString() : 'Unknown'}</div>
              <div className="flex items-center gap-2">
                <strong>Your Role:</strong>
                {isOwner ? (
                  <Badge variant="default" className="bg-yellow-500">
                    <Crown className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                ) : (
                  <Badge variant="secondary">Admin</Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Member Management */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Member Management</h3>
            <div className="space-y-4">
              {teamUsers.map((user) => {
                const isCurrentUser = user.user_id === userId;
                const isUserOwner = team?.created_by === user.user_id;
                const displayName = user.users?.display_name || user.users?.email || user.user_id;
                
                return (
                  <div key={user.user_id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-sm text-muted-foreground">{user.users?.email}</div>
                      </div>
                      {isUserOwner && (
                        <Badge variant="default" className="bg-yellow-500">
                          <Crown className="h-3 w-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                      {!isUserOwner && (
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!isCurrentUser && !isUserOwner && (
                        <>
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleRoleChange(user.user_id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveMember(user.user_id)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Transfer Ownership */}
          {isOwner && eligibleNewOwners.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Transfer Ownership</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Transfer ownership to another admin member. You will become an admin after the transfer.
              </p>
              
              <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Crown className="h-4 w-4 mr-2" />
                    Transfer Ownership
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transfer Team Ownership</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. The selected admin will become the new team owner,
                      and you will become a team admin.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleNewOwners.map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.users?.display_name || user.users?.email || user.user_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleTransferOwnership}
                      disabled={!selectedNewOwner}
                    >
                      Transfer Ownership
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          )}

          {/* Danger Zone */}
          {isOwner && (
            <Card className="p-6 border-red-200">
              <h3 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting the team will permanently remove all boards, tasks, and data. This cannot be undone.
              </p>
              <Button variant="destructive" onClick={handleDeleteTeam}>
                Delete Team
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
