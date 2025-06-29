"use client";
import { use, useEffect, useState } from "react";
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
interface TeamUser {
  id: string;
  user_id: string;
  role: string;
  accepted_at: string;
  users: { email: string };
}

export default function TeamOverviewPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { session } = useSession();
  const userId = session?.user.id;
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [open, setOpen] = useState(false);

  const isAdmin = members.find(m => m.user_id === userId)?.role === "admin";

  useEffect(() => {
    fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function fetchTeam() {
    setLoading(true);
    const { data: teamData } = await supabase.from("teams").select("*").eq("id", teamId).single();
    setTeam(teamData);
    const { data: memberData } = await supabase
      .from("team_users")
      .select("id, user_id, role, accepted_at, users(email)")
      .eq("team_id", teamId);

    // Map users to extract the first user object from the array
    const normalizedMembers = (memberData || []).map((member: any) => ({
      ...member,
      users: member.users && Array.isArray(member.users) ? member.users[0] : member.users,
    }));

    setMembers(normalizedMembers);
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    // Find user by email
    const { data: user } = await supabase.from("users").select("id").eq("email", inviteEmail).single();
    if (user) {
      await supabase.from("team_users").insert([
        { team_id: teamId, user_id: user.id, role: "member" },
      ]);
      setInviteEmail("");
      fetchTeam();
    }
  }

  async function handleRemove(user_id: string) {
    await supabase.from("team_users").delete().eq("team_id", teamId).eq("user_id", user_id);
    fetchTeam();
  }

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
        <Card className="p-6 mb-6">
          <div className="font-bold text-lg mb-2">{team.name}</div>
          <div className="text-xs text-muted-foreground mb-2">Created {new Date(team.created_at).toLocaleDateString()}</div>
          <div className="font-semibold mb-2">Members</div>
          <ul className="mb-4">
            {members.map(member => (
              <li key={member.id} className="flex items-center gap-2 mb-1">
                <span>{member.users?.email || member.user_id}</span>
                <span className="text-xs text-muted-foreground">({member.role})</span>
                {isAdmin && member.user_id !== userId && (
                  <Button size="sm" variant="destructive" onClick={() => handleRemove(member.user_id)}>
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {isAdmin && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">Invite User</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Invite User by Email</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleInvite} className="space-y-4 mt-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full">Invite</Button>
                </form>
              </SheetContent>
            </Sheet>
          )}
        </Card>
      ) : (
        <div className="text-muted-foreground">Team not found.</div>
      )}
    </div>
  );
}
