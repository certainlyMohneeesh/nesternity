"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/session-context";
import { getSafeSession } from "@/lib/safe-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserPlus, Loader2 } from "lucide-react";

export function JoinTeam() {
  const { session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoinTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const session = await getSafeSession();
      
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      // Accept the invite using the token
      const response = await fetch(`/api/invite/${inviteCode.trim()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setOpen(false);
        setInviteCode("");
        // Show success message
        alert(`✅ Successfully joined ${data.team?.name || 'the team'}!`);
        // Redirect to the team page
        router.push(`/dashboard/teams/${data.teamId}`);
        router.refresh(); // Refresh to update teams list
      } else {
        setError(data.error || 'Failed to join team');
      }
    } catch (error) {
      console.error('Join team error:', error);
      setError('Failed to join team');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Join Team
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Join Team by Invite Code</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Enter the invite code you received via email or from a team member.
            </p>
            <p className="text-xs text-muted-foreground">
              Invite codes are long alphanumeric strings (e.g., "abc123def456...")
            </p>
          </div>

          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading || !inviteCode.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining Team...
                </>
              ) : (
                'Join Team'
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
