import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTeamInvite, getTeamInvites, cancelInvite, PendingInvite } from "@/lib/invites";
import { createActivity, ACTIVITY_TYPES } from "@/lib/notifications";
import { Mail, UserPlus, Trash2, Copy, Users, Send } from "lucide-react";
import { useSession } from "@/components/auth/session-context";

interface InviteMembersProps {
  teamId: string;
  teamName: string;
  onMemberAdded?: () => void;
  trigger?: React.ReactNode;
}

export default function InviteMembers({ teamId, teamName, onMemberAdded, trigger }: InviteMembersProps) {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      try {
        // Load pending invites when opening
        console.log('📨 Loading pending invites for team:', teamId);
        const invites = await getTeamInvites(teamId);
        setPendingInvites(invites);
        console.log('✅ Successfully loaded invites:', invites);
      } catch (error) {
        console.error('❌ Failed to load pending invites:', error);
        setError(error instanceof Error ? error.message : 'Failed to load pending invites');
        setPendingInvites([]);
      }
    } else {
      // Reset form when closing
      setInviteEmail("");
      setInviteRole("member");
      setError(null);
      setSuccess(null);
    }
  };

  async function handleDirectInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Find user by email in the users table
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, display_name, email")
        .eq("email", inviteEmail)
        .single();

      if (userError || !user) {
        setError("User not found. They must register first or use the email invite feature.");
        setLoading(false);
        return;
      }

      // Use the secure function to add member
      const { data: result, error: addError } = await supabase.rpc('add_team_member', {
        team_uuid: teamId,
        new_user_id: user.id,
        member_role: inviteRole
      });
      
      if (addError) {
        setError("Failed to add member: " + addError.message);
        setLoading(false);
        return;
      }

      if (!result.success) {
        setError(result.error || "Failed to add member");
        setLoading(false);
        return;
      }

      // Create activity for member addition
      await createActivity(
        teamId,
        ACTIVITY_TYPES.MEMBER_ADDED,
        `New member added: ${user.display_name || user.email}`,
        `${user.display_name || user.email} was added to the team as ${inviteRole}`
      );
      
      setSuccess(`${user.display_name || user.email} has been added to the team!`);
      setInviteEmail("");
      
      if (onMemberAdded) {
        onMemberAdded();
      }
      
    } catch (err) {
      console.error("Error adding member:", err);
      setError("An unexpected error occurred while adding the member.");
    }
    
    setLoading(false);
  }

  async function handleEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createTeamInvite(teamId, inviteEmail, inviteRole);
      
      if (!result.success) {
        setError(result.error || "Failed to create invite");
        setLoading(false);
        return;
      }

      // Create activity for invite sent
      await createActivity(
        teamId,
        ACTIVITY_TYPES.INVITE_SENT,
        `Invite sent to ${inviteEmail}`,
        `An invitation was sent to ${inviteEmail} to join as ${inviteRole}`
      );

      // Show appropriate success message based on email sending result
      if (result.emailSent) {
        setSuccess(`✅ Invite sent to ${inviteEmail}! They will receive an email with instructions.`);
      } else {
        setSuccess(`⚠️ Invite created for ${inviteEmail}, but email could not be sent. You can share the invite link from the pending invites list.`);
      }
      
      setInviteEmail("");
      
      // Refresh pending invites
      try {
        const invites = await getTeamInvites(teamId);
        setPendingInvites(invites);
      } catch (error) {
        console.error('Failed to refresh invites after sending:', error);
        // Don't show error to user here, invite was successful
      }
      
    } catch (err) {
      console.error("Error sending invite:", err);
      setError("An unexpected error occurred while sending the invite.");
    }
    
    setLoading(false);
  }

  async function handleCancelInvite(inviteId: string, email: string) {
    setLoading(true);
    const result = await cancelInvite(inviteId);
    
    if (result.success) {
      setSuccess(`Invite to ${email} has been cancelled.`);
      try {
        const invites = await getTeamInvites(teamId);
        setPendingInvites(invites);
      } catch (error) {
        console.error('Failed to refresh invites after cancelling:', error);
        // Still show success for the cancellation
      }
    } else {
      setError("Failed to cancel invite: " + result.error);
    }
    
    setLoading(false);
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setSuccess("Invite link copied to clipboard!");
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <UserPlus className="h-4 w-4 mr-2" />
      Invite Members
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>
            <Users className="h-5 w-5 inline mr-2" />
            Invite Members to {teamName}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Status Messages */}
          {error && (
            <Card className="p-3 border-red-200 bg-red-50">
              <div className="text-red-700 text-sm">{error}</div>
            </Card>
          )}
          
          {success && (
            <Card className="p-3 border-green-200 bg-green-50">
              <div className="text-green-700 text-sm">{success}</div>
            </Card>
          )}

          {/* Invite Methods */}
          <Tabs defaultValue="direct" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct">Direct Add</TabsTrigger>
              <TabsTrigger value="email">Email Invite</TabsTrigger>
            </TabsList>
            
            <TabsContent value="direct" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Add users who have already registered on the platform.
              </div>
              <form onSubmit={handleDirectInvite} className="space-y-4">
                <div>
                  <Label htmlFor="direct-email">Email Address</Label>
                  <Input
                    id="direct-email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    type="email"
                    placeholder="user@example.com"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="direct-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Adding..." : "Add Member"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="email" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Send an email invitation to users who haven't registered yet.
              </div>
              <form onSubmit={handleEmailInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email-invite">Email Address</Label>
                  <Input
                    id="email-invite"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    type="email"
                    placeholder="user@example.com"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="email-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : "Send Invite"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              <div className="font-semibold text-sm">
                Pending Invites ({pendingInvites.length})
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pendingInvites.map(invite => (
                  <Card key={invite.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{invite.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="outline" className="text-xs">
                          {invite.role}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => copyInviteLink(invite.token)}
                          disabled={loading}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleCancelInvite(invite.id, invite.email)}
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
