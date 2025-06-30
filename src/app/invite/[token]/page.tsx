"use client";
import { use, useEffect, useState } from "react";
import { useSession } from "@/components/auth/session-context";
import { acceptInvite } from "@/lib/invites";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Users, Mail, Clock } from "lucide-react";
import Link from "next/link";

interface InviteDetails {
  id: string;
  team_id: string;
  email: string;
  role: string;
  expires_at: string;
  used_at?: string;
  teams?: {
    name: string;
  };
  inviter?: {
    display_name?: string;
    email: string;
  };
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [result, setResult] = useState<{ success: boolean; error?: string; teamId?: string } | null>(null);

  useEffect(() => {
    fetchInviteDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (session?.user && invite && !invite.used_at) {
      handleAcceptInvite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, invite]);

  async function fetchInviteDetails() {
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select(`
          id, team_id, email, role, expires_at, used_at,
          teams:team_id (name),
          inviter:invited_by (display_name, email)
        `)
        .eq('token', token)
        .single();

      if (error || !data) {
        console.error('Error fetching invite:', error);
        setResult({ success: false, error: 'Invalid or expired invitation' });
        setLoading(false);
        return;
      }

      // Handle potential array responses
      const processedInvite = {
        ...data,
        teams: Array.isArray(data.teams) ? data.teams[0] : data.teams,
        inviter: Array.isArray(data.inviter) ? data.inviter[0] : data.inviter,
      };

      setInvite(processedInvite);

      // Check if expired
      if (new Date(processedInvite.expires_at) < new Date()) {
        setResult({ success: false, error: 'This invitation has expired' });
      }

      // Check if already used
      if (processedInvite.used_at) {
        setResult({ success: true, teamId: processedInvite.team_id });
      }

    } catch (err) {
      console.error('Error fetching invite details:', err);
      setResult({ success: false, error: 'Failed to load invitation' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptInvite() {
    setLoading(true);
    const response = await acceptInvite(token);
    setResult(response);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading invitation...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
            <p className="text-gray-600">You need to be logged in to accept this invitation.</p>
          </div>

          {invite && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{invite.teams?.name}</span>
                <Badge variant="secondary">{invite.role}</Badge>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>Invited: {invite.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
                </div>
                {invite.inviter && (
                  <div className="text-xs text-gray-500 mt-2">
                    From: {invite.inviter.display_name || invite.inviter.email}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href={`/auth/login?redirect=/invite/${token}`}>
                Sign In
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/auth/register?redirect=/invite/${token}`}>
                Create Account
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-700 mb-2">Welcome to the team! 🎉</h1>
            <p className="text-gray-600 mb-6">
              You've successfully joined <strong>{invite?.teams?.name}</strong>
            </p>
            <Button asChild className="w-full">
              <Link href={`/dashboard/teams/${result.teamId}`}>
                Go to Team
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-700 mb-2">Invitation Error</h1>
            <p className="text-gray-600 mb-6">{result.error}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/teams">
                Go to Teams
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Accepting invite (should only reach here if logged in and invite is valid)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h1 className="text-2xl font-bold mb-2">Accepting Invitation...</h1>
          <p className="text-gray-600">Please wait while we add you to the team.</p>
        </div>
      </Card>
    </div>
  );
}
