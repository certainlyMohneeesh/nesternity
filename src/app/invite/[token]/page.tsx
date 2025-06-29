"use client";
import { use, useEffect, useState } from "react";
import { useSession } from "@/components/auth/session-context";
import { acceptInvite } from "@/lib/invites";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ success: boolean; error?: string; teamId?: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      handleAcceptInvite();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, token]);

  async function handleAcceptInvite() {
    setLoading(true);
    const response = await acceptInvite(token);
    setResult(response);
    setLoading(false);
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Team Invite</h1>
            <p className="text-muted-foreground">
              You need to be logged in to accept this team invitation.
            </p>
            <div className="space-y-2">
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
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-6">
        <div className="text-center space-y-4">
          {loading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <h1 className="text-2xl font-bold">Processing Invite...</h1>
              <p className="text-muted-foreground">
                Please wait while we add you to the team.
              </p>
            </>
          ) : result?.success ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-green-700">Invite Accepted!</h1>
              <p className="text-muted-foreground">
                You have successfully joined the team.
              </p>
              <Button asChild className="w-full">
                <Link href={`/dashboard/teams/${result.teamId}`}>
                  View Team
                </Link>
              </Button>
            </>
          ) : (
            <>
              <XCircle className="h-8 w-8 text-red-500 mx-auto" />
              <h1 className="text-2xl font-bold text-red-700">Invite Failed</h1>
              <p className="text-muted-foreground">
                {result?.error || "This invite is invalid or has expired."}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/teams">
                  Go to Teams
                </Link>
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
