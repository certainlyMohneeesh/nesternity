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

interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
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
    const { data, error } = await supabase
      .from("team_users")
      .select("teams(id, name, created_by, created_at)")
      .eq("user_id", userId);
    if (!error && data) {
      setTeams(data.map((row: any) => row.teams));
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
          <div className="text-muted-foreground">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="text-muted-foreground">You are not a member of any teams yet.</div>
        ) : (
          teams.map(team => (
            <Card key={team.id} className="p-6 flex flex-col gap-2">
              <div className="font-bold text-lg">{team.name}</div>
              <div className="text-xs text-muted-foreground mb-2">Created {new Date(team.created_at).toLocaleDateString()}</div>
              <Button asChild variant="outline">
                <Link href={`/dashboard/teams/${team.id}`}>Open Team</Link>
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
