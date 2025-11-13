"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSessionToken } from '@/lib/supabase/client-session';
import { useSession } from "@/components/auth/session-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, Crown, Shield } from "lucide-react";
import Link from "next/link";
import { JoinTeam } from "@/components/teams/join-team";

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

// Extend Team type for optimistic UI
interface TempTeam extends Team {
  isTemp: true;
}
type TeamOrTemp = Team | TempTeam;

export default function TeamsPage() {
  const params = useParams();
  const orgId = params.id as string;
  const projectId = params.projectId as string;
  
  const { session, loading: sessionLoading } = useSession();
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<TeamOrTemp[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    if (!sessionLoading) {
      loadUserAndTeams();
    }
  }, [sessionLoading]);

  async function loadUserAndTeams() {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!session?.user) {
        window.location.href = '/auth/login';
        return;
      }
      setUser(session.user);

      // Fetch teams using new API
      await fetchTeams();
    } catch (error) {
      console.error('Error loading user and teams:', error);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeams() {
    const token = await getSessionToken();
    
    try {
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Add organisationId to filter teams by organisation
      const response = await fetch(`/api/teams?organisationId=${orgId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.ok) {
        setTeams(data.teams || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch teams');
      }
    } catch (error) {
      console.error('Fetch teams error:', error);
      setError('Failed to fetch teams');
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    if (!session) {
      setError('Not authenticated');
      setCreating(false);
      return;
    }
    // Create a temporary team object for optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimisticTeam: TempTeam = {
      id: tempId,
      name: teamName.trim(),
      description: teamDescription.trim() || '',
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
      owner: {
        id: user?.id || '',
        email: user?.email || '',
        displayName: user?.name || 'You',
      },
      members: [{
        id: `temp-member-${Date.now()}`,
        role: 'owner',
        user: {
          id: user?.id || '',
          email: user?.email || '',
          displayName: user?.name || 'You',
        },
      }],
      _count: { members: 1 },
      isTemp: true,
    };
    setTeams(prev => [optimisticTeam, ...prev]);


    const token = await getSessionToken();
    try {
      if (!token) {
        setError('Not authenticated');
        return;
      }
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamName.trim(),
          description: teamDescription.trim() || null,
          organisationId: orgId  // Include organisationId when creating team
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Replace temp team with real team
        setTeams(prev => [data.team, ...prev.filter(t => t.id !== tempId)]);
        setTeamName("");
        setTeamDescription("");
        setOpen(false);
      } else {
        // Remove temp team and show error
        setTeams(prev => prev.filter(t => t.id !== tempId));
        setError(data.error || 'Failed to create team');
      }
    } catch (error) {
      setTeams(prev => prev.filter(t => t.id !== tempId));
      setError('Failed to create team');
    } finally {
      setCreating(false);
    }
  }

  function getRoleIcon(team: Team) {
    const userMember = team.members?.find(m => m.user.id === user?.id);
    const isOwner = team.createdBy === user?.id;
    
    if (isOwner) {
      return <Crown className="h-4 w-4 text-yellow-500" />;
    } else if (userMember?.role === 'admin') {
      return <Shield className="h-4 w-4 text-blue-500" />;
    }
    return <Users className="h-4 w-4 text-gray-500" />;
  }

  function getRoleBadge(team: Team) {
    const userMember = team.members?.find(m => m.user.id === user?.id);
    const isOwner = team.createdBy === user?.id;
    
    if (isOwner) {
      return <Badge variant="default">Owner</Badge>;
    } else if (userMember?.role === 'admin') {
      return <Badge variant="secondary">Admin</Badge>;
    }
    return <Badge variant="outline">Member</Badge>;
  }

  if (sessionLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        <div className="flex gap-2">
          <JoinTeam />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </SheetTrigger>
            <SheetContent>
            <SheetHeader>
              <SheetTitle>Create New Team</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleCreateTeam} className="space-y-4 mt-6">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="teamDescription">Description (Optional)</Label>
                <Textarea
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Brief description of the team"
                  rows={3}
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <Button type="submit" disabled={creating || !teamName.trim()} className="w-full">
                {creating ? "Creating..." : "Create Team"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      {error && !open && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <Button onClick={fetchTeams} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="p-6 hover:shadow-lg transition-shadow opacity-100 relative">
            {'isTemp' in team && team.isTemp && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  )}
                </div>
                {getRoleIcon(team)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{team._count.members} member{team._count.members !== 1 ? 's' : ''}</span>
                </div>
                {getRoleBadge(team)}
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="pt-2">
                <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/teams/${team.id}`}>
                  <Button variant="outline" className="w-full">
                    View Team
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {teams.length === 0 && !loading && (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No teams yet</h3>
            <p className="text-muted-foreground mb-4">Create your first team to get started</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
