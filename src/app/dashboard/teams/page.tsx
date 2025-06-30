"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useSession } from "@/components/auth/session-context";
import InviteMembers from "@/components/teams/invite-members";

interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface UserTeamFunction {
  team_id: string;
  team_name: string;
  role: string;
  created_by: string;
}

export default function TeamsPage() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchTeams() {
    setLoading(true);
    setError(null);
    
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Use the ultimate secure function (no RLS recursion possible)
      const { data: secureTeams, error: secureError } = await supabase
        .rpc('get_user_teams_ultimate', { user_uuid: userId });
      
      if (!secureError && secureTeams) {
        console.log('✅ Successfully fetched teams via secure function:', secureTeams);
        setTeams(secureTeams.map((team: any) => ({
          id: team.id,
          name: team.name,
          created_by: team.created_by,
          created_at: team.created_at
        })));
        setLoading(false);
        return;
      } else {
        console.log('❌ Secure function failed:', secureError);
      }
      
      // Fallback: Direct teams query (only shows created teams)
      console.log('🔄 Using fallback: creator-only query...');
      const { data: createdTeams, error: createdError } = await supabase
        .from('teams')
        .select('id, name, created_by, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      
      if (!createdError) {
        console.log('✅ Fallback query successful:', createdTeams);
        setTeams(createdTeams || []);
      } else {
        console.log('❌ All methods failed:', createdError);
        setError(`Database access issue. Please run the ultimate_recursion_fix.sql script.`);
        setTeams([]);
      }
      
    } catch (err) {
      console.error('💥 Unexpected error:', err);
      setError('Please run the database fix script to enable team management.');
      setTeams([]);
    }
    
    setLoading(false);
  }

  console.log(session);

  console.log(session?.user.id);
  

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId || !teamName) return;
    // 1. Create team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert([{ name: teamName, created_by: session.user.id }])
      .select()
      .single();
    if (teamError || !team) {
      setError(teamError?.message || "Failed to create team");
      return;
    }
    // 2. Add user as admin
    const { error: userError } = await supabase.from("team_users").insert([
      { team_id: team.id, user_id: userId, role: "admin", accepted_at: new Date().toISOString() },
    ]);
    if (userError) {
      setError(userError.message || "Failed to add user to team");
      return;
    }
    setOpen(false);
    setTeamName("");
    fetchTeams();
  }

  async function handleJoinTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !inviteCode) return;
    setJoining(true);
    // For demo: treat inviteCode as teamId
    const { data: team, error } = await supabase.from("teams").select("*").eq("id", inviteCode).single();
    if (!error && team) {
      await supabase.from("team_users").insert([
        { team_id: team.id, user_id: userId, role: "member", accepted_at: new Date().toISOString() },
      ]);
      setInviteCode("");
      fetchTeams();
    }
    setJoining(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Teams</h2>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>Create Team</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create a New Team</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleCreateTeam} className="space-y-4 mt-4">
              <div>
                <Label>Team Name</Label>
                <Input value={teamName} onChange={e => setTeamName(e.target.value)} required />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      <form onSubmit={handleJoinTeam} className="flex gap-2 mb-8">
        <Input
          placeholder="Enter invite code (team ID)"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
        />
        <Button type="submit" disabled={joining}>Join Team</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full">
            <Card className="p-6">
              <div className="text-center text-muted-foreground">Loading teams...</div>
            </Card>
          </div>
        ) : error ? (
          <div className="col-span-full">
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="text-red-700 font-medium">Error loading teams</div>
              <div className="text-red-600 text-sm mt-1">{error}</div>
              <Button 
                onClick={fetchTeams} 
                variant="outline" 
                className="mt-3"
              >
                Try Again
              </Button>
            </Card>
          </div>
        ) : teams.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8">
              <div className="text-center space-y-4">
                <div className="text-muted-foreground">
                  You are not a member of any teams yet.
                </div>
                <div className="text-sm text-muted-foreground">
                  Create a new team above to get started, or ask someone to invite you to their team!
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    💡 <strong>Tip:</strong> Team creators can invite members directly from team cards
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          teams.map(team => (
            <Card key={team.id} className="p-6 flex flex-col gap-3">
              <div className="flex-1">
                <div className="font-bold text-lg">{team.name}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  Created {new Date(team.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  ID: {team.id}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link href={`/dashboard/teams/${team.id}`}>Open Team</Link>
                </Button>
                {(team.created_by === userId) && (
                  <InviteMembers 
                    teamId={team.id} 
                    teamName={team.name}
                    onMemberAdded={fetchTeams}
                    trigger={
                      <Button variant="secondary" size="sm">
                        Invite Members
                      </Button>
                    }
                  />
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
