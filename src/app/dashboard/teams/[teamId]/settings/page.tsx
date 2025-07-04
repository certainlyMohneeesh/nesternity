"use client";
import { use, useEffect, useState } from "react";
import { useSession } from "@/components/auth/session-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, 
  UserX, 
  Settings, 
  Users, 
  Shield, 
  Trash2, 
  Edit3, 
  Mail, 
  Calendar,
  AlertTriangle
} from "lucide-react";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  addedBy: string;
  acceptedAt: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  _count: {
    boards: number;
    projects: number;
    members: number;
  };
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  inviter: {
    displayName: string | null;
    email: string;
  };
}

export default function TeamSettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { session, loading: sessionLoading } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  // Form states
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchTeamData();
      fetchInvites();
    }
  }, [sessionLoading, session, teamId]);

  async function fetchTeamData() {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team data');
      }

      const data = await response.json();
      const teamData = data.team || data; // Handle both { team } and direct team object
      setTeam(teamData);
      setTeamName(teamData.name);
      setTeamDescription(teamData.description || "");
      
      // Check user permissions - safely handle undefined members
      const currentUserMember = teamData.members?.find((m: TeamMember) => m.userId === session?.user.id);
      setIsOwner(teamData.createdBy === session?.user.id);
      setIsAdmin(currentUserMember?.role === 'admin' || teamData.createdBy === session?.user.id);
      
    } catch (error) {
      console.error('Error fetching team:', error);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvites() {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/invites?teamId=${teamId}`, {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvites(data);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  }

  async function saveTeamSettings() {
    setSaving(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription
        })
      });

      if (response.ok) {
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error saving team:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });

      if (response.ok) {
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  }

  async function handleInviteMember() {
    if (!inviteEmail) return;

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (response.ok) {
        setInviteEmail("");
        setInviteRole("member");
        fetchInvites();
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  }

  async function handleTransferOwnership() {
    if (!selectedNewOwner) return;

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({ newOwnerId: selectedNewOwner })
      });

      if (response.ok) {
        setTransferDialogOpen(false);
        setSelectedNewOwner("");
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error transferring ownership:', error);
    }
  }

  async function handleDeleteTeam() {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });

      if (response.ok) {
        window.location.href = '/dashboard/teams';
      }
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-3xl font-bold tracking-tight">Team Settings</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-3xl font-bold tracking-tight">Team Settings</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-destructive bg-destructive/10 p-4 rounded-lg">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-3xl font-bold tracking-tight">Team Settings</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-amber-600 bg-amber-50 p-4 rounded-lg">
              You must be a team admin to manage settings.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminMembers = team.members.filter(m => m.role === 'admin' && m.userId !== session?.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-3xl font-bold tracking-tight">Team Settings</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="invites" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invites
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Team Information
              </CardTitle>
              <CardDescription>
                Update your team's basic information and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Created</Label>
                  <Input
                    value={new Date(team.createdAt).toLocaleDateString()}
                    disabled
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teamDescription">Description</Label>
                <Textarea
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Describe your team's purpose and goals"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Members</Label>
                  <div className="text-2xl font-bold">{team._count.members}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Boards</Label>
                  <div className="text-2xl font-bold">{team._count.boards}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Projects</Label>
                  <div className="text-2xl font-bold">{team._count.projects}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={saveTeamSettings}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage team members and their roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.members.map((member) => {
                  const isCurrentUser = member.userId === session?.user.id;
                  const isMemberOwner = team.createdBy === member.userId;
                  const displayName = member.user.displayName || member.user.email;
                  
                  return (
                    <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{displayName}</div>
                          <div className="text-sm text-muted-foreground">{member.user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Joined {new Date(member.acceptedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isMemberOwner ? (
                          <Badge variant="default" className="bg-yellow-500">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        ) : (
                          <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                            {member.role}
                          </Badge>
                        )}
                        
                        {!isCurrentUser && !isMemberOwner && (
                          <div className="flex items-center gap-1">
                            <Select
                              value={member.role}
                              onValueChange={(newRole) => handleRoleChange(member.userId, newRole)}
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
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Team Invitations
              </CardTitle>
              <CardDescription>
                Invite new members to join your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInviteMember}>
                  Send Invite
                </Button>
              </div>

              {invites.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Pending Invitations</h4>
                  {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <div className="font-medium">{invite.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Invited by {invite.inviter.displayName || invite.inviter.email} • 
                          Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary">{invite.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {/* Transfer Ownership */}
          {isOwner && adminMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Transfer Ownership
                </CardTitle>
                <CardDescription>
                  Transfer ownership to another admin member. You will become an admin after the transfer.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                          {adminMembers.map((member) => (
                            <SelectItem key={member.userId} value={member.userId}>
                              {member.user.displayName || member.user.email}
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
              </CardContent>
            </Card>
          )}

          {/* Delete Team */}
          {isOwner && (
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Deleting the team will permanently remove all boards, tasks, and data. This cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Team</DialogTitle>
                      <DialogDescription>
                        Are you absolutely sure you want to delete this team? This action cannot be undone.
                        All boards, tasks, projects, and data will be permanently removed.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Type the team name <strong>{team.name}</strong> to confirm:
                      </p>
                      <Input placeholder={team.name} />
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteTeam}
                      >
                        Delete Team
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
