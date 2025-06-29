"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/auth/session-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  } | null;
}

export default function TeamSettingsPage({ params }: { params: { teamId: string } }) {
  const { session } = useSession();
  const userId = session?.user.id;
  const teamId = params.teamId;
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && teamId) fetchTeamUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, teamId]);

  async function fetchTeamUsers() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("team_users")
      .select("id, user_id, team_id, role, accepted_at, users(id, email, user_metadata)")
      .eq("team_id", teamId);
    if (error) {
      setError("Failed to load team members");
      setLoading(false);
      return;
    }
    setTeamUsers((data || []).map((row: any) => ({ ...row, users: row.users ?? null })));
    setIsAdmin(!!data?.find((u: any) => u.user_id === userId && u.role === "admin"));
    setLoading(false);
  }

  async function handleDeleteTeam() {
    if (!confirm("Are you sure you want to delete this team? This cannot be undone.")) return;
    await supabase.from("teams").delete().eq("id", teamId);
    // Optionally redirect after delete
    window.location.href = "/dashboard/teams";
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Team Settings</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : !isAdmin ? (
        <div className="text-yellow-600 bg-yellow-50 p-4 rounded">You must be a team admin to manage settings.</div>
      ) : (
        <div className="space-y-8">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Team Members</h3>
            <ul className="space-y-2">
              {teamUsers.map((u) => (
                <li key={u.user_id} className="flex items-center justify-between">
                  <span>{u.users?.email || u.user_id}</span>
                  <span className="text-xs text-muted-foreground">{u.role}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Danger Zone</h3>
            <Button variant="destructive" onClick={handleDeleteTeam}>
              Delete Team
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
