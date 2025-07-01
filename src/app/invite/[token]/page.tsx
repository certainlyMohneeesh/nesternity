'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSafeSession, getSafeUser } from '@/lib/safe-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react';

interface InviteData {
  id: string;
  email: string;
  role: string;
  team: {
    id: string;
    name: string;
    description?: string;
  };
  inviter: {
    email: string;
    displayName?: string;
  };
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadInviteAndUser();
  }, [token]);

  async function loadInviteAndUser() {
    try {
      setLoading(true);
      setError(null);

      // Get current user safely - this won't throw an error if session is invalid
      const currentUser = await getSafeUser();
      setUser(currentUser);

      // Get invite details - this should work regardless of auth state
      const response = await fetch(`/api/invites/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load invite');
      }

      setInvite(data.invite);
    } catch (err: any) {
      console.error('Load invite error:', err);
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptInvite() {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/invite/${token}`);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
      return;
    }

    try {
      setAccepting(true);
      setError(null);

      // Get current session for auth token
      const session = await getSafeSession();
      
      if (!session?.access_token) {
        // If no valid session, redirect to login
        const returnUrl = encodeURIComponent(`/invite/${token}`);
        router.push(`/auth/login?returnUrl=${returnUrl}`);
        return;
      }

      const response = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invite');
      }

      setSuccess(true);
      
      // Redirect to team dashboard after a short delay
      setTimeout(() => {
        router.push(`/dashboard/teams/${invite?.team.id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full mt-4"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle>Welcome to {invite?.team.name}!</CardTitle>
            <CardDescription>
              You've successfully joined the team. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {invite && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-lg">{invite.team.name}</h3>
                {invite.team.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {invite.team.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Role: <span className="font-medium capitalize">{invite.role}</span>
                </p>
              </div>

              <div className="text-sm text-center">
                <p className="text-muted-foreground">
                  Invited by{' '}
                  <span className="font-medium">
                    {invite.inviter.displayName || invite.inviter.email}
                  </span>
                </p>
              </div>

              {error && (
                <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {!user ? (
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground">
                    Please sign in to accept this invitation
                  </p>
                  <Button onClick={handleAcceptInvite} className="w-full">
                    Sign In to Accept
                  </Button>
                </div>
              ) : user.email !== invite.email ? (
                <div className="space-y-3">
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      This invitation was sent to {invite.email}, but you're signed in as {user.email}.
                      Please sign in with the correct account.
                    </p>
                  </div>
                  <Button 
                    onClick={() => supabase.auth.signOut().then(() => handleAcceptInvite())} 
                    variant="outline" 
                    className="w-full"
                  >
                    Sign Out & Use Different Account
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleAcceptInvite} 
                  disabled={accepting}
                  className="w-full"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting Invitation...
                    </>
                  ) : (
                    'Accept Invitation'
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
