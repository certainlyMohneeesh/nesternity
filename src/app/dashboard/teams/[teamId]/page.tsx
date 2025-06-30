"use client";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSession } from "@/components/auth/session-context";
import { createTeamInvite, getTeamInvites, cancelInvite, PendingInvite } from "@/lib/invites";
import { createActivity, ACTIVITY_TYPES } from "@/lib/notifications";
import { Mail, UserPlus, Trash2, Copy } from "lucide-react";
import ActivityFeed from "@/components/teams/activity-feed";

interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}
interface TeamUser {
  id: string;
  user_id: string;
  role: string;
  accepted_at: string;
  users?: {
    id: string;
    email: string;
    display_name?: string;
  };
}

export default function TeamOverviewPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { session } = useSession();
  const userId = session?.user.id;
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [open, setOpen] = useState(false);

  const isAdmin = members.find(m => m.user_id === userId)?.role === "admin" || team?.created_by === userId;

  useEffect(() => {
    if (userId) fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, userId]);

  async function fetchTeam() {
    setLoading(true);
    
    // Fetch team data
    const { data: teamData } = await supabase.from("teams").select("*").eq("id", teamId).single();
    setTeam(teamData);
    
    // Fetch members with user details
    const { data: memberData } = await supabase
      .from("team_users")
      .select(`
        id, user_id, role, accepted_at,
        users:user_id (id, email, display_name)
      `)
      .eq("team_id", teamId);
    setMembers((memberData || []).map((row: any) => ({
      ...row,
      users: Array.isArray(row.users) ? row.users[0] : row.users
    })));
    
    // Fetch pending invites
    if (memberData?.find(m => m.user_id === userId && m.role === "admin") || teamData?.created_by === userId) {
      const invites = await getTeamInvites(teamId);
      setPendingInvites(invites);
    }
    
    setLoading(false);
  }

  async function handleDirectInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    
    // Find user by email in the users table
    const { data: user, error } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("email", inviteEmail)
      .single();

    if (error || !user) {
      alert("User not found. They must register first or use the email invite feature.");
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("team_users")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      alert("User is already a member of this team.");
      return;
    }

    // Add as member
    const { error: addError } = await supabase.from("team_users").insert([
      { team_id: teamId, user_id: user.id, role: "member", accepted_at: new Date().toISOString() },
    ]);
    
    if (addError) {
      alert("Failed to add member: " + addError.message);
      return;
    }

    // Create activity for member addition
    await createActivity(
      teamId,
      ACTIVITY_TYPES.MEMBER_ADDED,
      `New member added: ${user.display_name || inviteEmail}`,
      `${user.display_name || inviteEmail} was added to the team`
    );
    
    setInviteEmail("");
    fetchTeam();
  }

  async function handleEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !team) return;
    
    const result = await createTeamInvite(teamId, inviteEmail, "member");
    
    if (!result.success) {
      alert(result.error);
      return;
    }

    // Show appropriate message based on email sending result
    if (result.emailSent) {
      console.log(`📧 Email invite sent to ${inviteEmail}`);
      alert(`✅ Invite sent to ${inviteEmail}! They will receive an email with instructions.`);
    } else {
      console.log(`⚠️ Invite created for ${inviteEmail} but email not sent`);
      alert(`⚠️ Invite created for ${inviteEmail}, but email could not be sent. You can share the invite link manually.`);
    }
    
    setInviteEmail("");
    fetchTeam();
  }

  async function handleCancelInvite(inviteId: string) {
    const result = await cancelInvite(inviteId);
    if (result.success) {
      fetchTeam();
    } else {
      alert("Failed to cancel invite: " + result.error);
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    alert("Invite link copied to clipboard!");
  }

  async function handleRemove(user_id: string) {
    const memberToRemove = members.find(m => m.user_id === user_id);
    if (!memberToRemove) return;

    const { error } = await supabase.from("team_users").delete().eq("team_id", teamId).eq("user_id", user_id);
    
    if (!error) {
      // Create activity for member removal
      const memberName = memberToRemove.users?.display_name || memberToRemove.users?.email || 'Unknown user';
      await createActivity(
        teamId,
        ACTIVITY_TYPES.MEMBER_REMOVED,
        `Member removed: ${memberName}`,
        `${memberName} was removed from the team`
      );
    }
    
    fetchTeam();
  }

  useEffect(() => {
    console.log("members", members);
    console.log("userId", userId);
    console.log("isAdmin", isAdmin);
  }, [members, userId, isAdmin]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Team Overview</h2>
      <div className="flex gap-4 mb-6">
        <Button asChild><Link href={`/dashboard/teams/${teamId}/boards`}>Boards</Link></Button>
        <Button asChild><Link href={`/dashboard/teams/${teamId}/clients`}>Clients</Link></Button>
        <Button asChild><Link href={`/dashboard/teams/${teamId}/settings`}>Settings</Link></Button>
      </div>
      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : team ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="font-bold text-lg mb-2">{team.name}</div>
            <div className="text-xs text-muted-foreground mb-2">Created {new Date(team.created_at).toLocaleDateString()}</div>
            <div className="font-semibold mb-2">Members ({members.length})</div>
            <ul className="mb-4 space-y-2">
              {members.map(member => (
                <li key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">
                      {member.users?.display_name || member.users?.email || member.user_id}
                    </div>
                    {member.users?.email && member.users?.display_name && (
                      <div className="text-sm text-muted-foreground">{member.users.email}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                    {isAdmin && member.user_id !== userId && (
                      <Button size="sm" variant="destructive" onClick={() => handleRemove(member.user_id)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Pending Invites */}
            {isAdmin && pendingInvites.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold mb-2">Pending Invites ({pendingInvites.length})</div>
                <ul className="space-y-2">
                  {pendingInvites.map(invite => (
                    <li key={invite.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div>
                        <div className="font-medium">{invite.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{invite.role}</Badge>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => copyInviteLink(invite.token)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleCancelInvite(invite.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isAdmin && (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Invite User to Team</SheetTitle>
                  </SheetHeader>
                  
                  <Tabs defaultValue="direct" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="direct">Direct Invite</TabsTrigger>
                      <TabsTrigger value="email">Email Invite</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="direct" className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Add users who have already registered on the platform.
                      </div>
                      <form onSubmit={handleDirectInvite} className="space-y-4">
                        <div>
                          <Label>Email Address</Label>
                          <Input
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            required
                            type="email"
                            placeholder="user@example.com"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Add Member
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="email" className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Send an email invitation to users who haven't registered yet.
                      </div>
                      <form onSubmit={handleEmailInvite} className="space-y-4">
                        <div>
                          <Label>Email Address</Label>
                          <Input
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            required
                            type="email"
                            placeholder="user@example.com"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invite
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </SheetContent>
              </Sheet>
            )}
          </Card>
          
          {/* Activity Feed */}
          <ActivityFeed teamId={teamId} />
        </div>
      ) : (
        <div className="text-muted-foreground">Team not found.</div>
      )}
    </div>
  );
}