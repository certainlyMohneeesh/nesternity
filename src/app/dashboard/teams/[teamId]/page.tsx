"use client";
import { use, useEffect, useState } from "react";
import { useSession } from "@/components/auth/session-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Mail, UserPlus, Trash2, Copy, Users, Crown, Shield } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  owner: {
    id: string;
    email: string;
    displayName?: string;
  };
  members: Array<{
    id: string;
    role: string;
    acceptedAt: string;
    user: {
      id: string;
      email: string;
      displayName?: string;
    };
  }>;
  _count: {
    members: number;
  };
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  teamId: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

export default function TeamOverviewPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;
  const [team, setTeam] = useState<Team | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = team?.members.find(m => m.user.id === userId)?.role === "admin" || team?.createdBy === userId;

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchTeam();
    }
  }, [teamId, sessionLoading, session]);

  async function fetchTeam() {
    try {
      setLoading(true);
      setError(null);

      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      // Fetch team details
      const teamResponse = await fetch(`/api/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!teamResponse.ok) {
        const errorData = await teamResponse.json();
        setError(errorData.error || 'Failed to fetch team');
        return;
      }

      const teamData = await teamResponse.json();
      const team = teamData.team || teamData; // Handle both response formats
      setTeam(team);

      // Fetch pending invites if user is admin/owner
      if (team.createdBy === userId || 
          team.members?.some((m: any) => m.user.id === userId && m.role === 'admin')) {
        await fetchInvites();
      }
    } catch (error) {
      console.error('Fetch team error:', error);
      setError('Failed to fetch team');
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvites() {
    try {
      if (!session?.access_token) return;

      const invitesResponse = await fetch(`/api/teams/invites?teamId=${teamId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (invitesResponse.ok) {
        const invitesData = await invitesResponse.json();
        setPendingInvites(invitesData.invites || []);
      }
    } catch (error) {
      console.error('Fetch invites error:', error);
    }
  }

  async function handleEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !team) return;

    try {
      if (!session?.access_token) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch('/api/teams/invites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          email: inviteEmail,
          role: 'member'
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.emailSent) {
          alert(`✅ Invitation sent to ${inviteEmail}!`);
        } else {
          alert(`✅ Invitation created for ${inviteEmail}! You can share the invite link manually.`);
        }
        setInviteEmail("");
        setOpen(false);
        await fetchInvites();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Invite error:', error);
      alert('Failed to send invitation');
    }
  }

  async function handleCancelInvite(inviteId: string) {
    try {
      if (!session?.access_token) return;

      const response = await fetch('/api/teams/invites', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId })
      });

      if (response.ok) {
        await fetchInvites();
      } else {
        const data = await response.json();
        alert("Failed to cancel invite: " + data.error);
      }
    } catch (error) {
      console.error('Cancel invite error:', error);
      alert('Failed to cancel invite');
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    alert("Invite link copied to clipboard!");
  }

  function getRoleIcon(member: any) {
    const isOwner = team?.createdBy === member.user.id;
    
    if (isOwner) {
      return <Crown className="h-4 w-4 text-yellow-500" />;
    } else if (member.role === 'admin') {
      return <Shield className="h-4 w-4 text-blue-500" />;
    }
    return <Users className="h-4 w-4 text-gray-500" />;
  }

  function getRoleBadge(member: any) {
    const isOwner = team?.createdBy === member.user.id;
    
    if (isOwner) {
      return <Badge variant="default">Owner</Badge>;
    } else if (member.role === 'admin') {
      return <Badge variant="secondary">Admin</Badge>;
    }
    return <Badge variant="outline">Member</Badge>;
  }

  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTeam} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Team not found.</p>
          <Link href="/dashboard/teams">
            <Button variant="outline" className="mt-4">
              Back to Teams
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Team Overview</h2>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/teams/${teamId}/boards`}>Boards</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/teams/${teamId}/clients`}>Clients</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/teams/${teamId}/settings`}>Settings</Link>
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
            {team.description && (
              <p className="text-muted-foreground mb-4">{team.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Created {new Date(team.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Members ({team.members.length})</h4>
              {isAdmin && (
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Invite Member to Team</SheetTitle>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Security Notice
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Only signed-in users can accept invitations. Make sure the recipient has an account and is signed in.
                        </p>
                      </div>
                    </SheetHeader>
                    
                    <div className="mt-6">
                      <form onSubmit={handleEmailInvite} className="space-y-4">
                        <div>
                          <Label htmlFor="inviteEmail">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invitation
                        </Button>
                      </form>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>

            <div className="space-y-2">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(member)}
                    <div>
                      <div className="font-medium">
                        {member.user.displayName || member.user.email}
                      </div>
                      {member.user.displayName && (
                        <div className="text-sm text-muted-foreground">
                          {member.user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invites */}
          {isAdmin && pendingInvites.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Pending Invitations ({pendingInvites.length})</h4>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}