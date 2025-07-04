"use client";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Ensure we're on the client side
        if (typeof window === 'undefined') {
          return;
        }

        // Get the hash fragment which contains the auth tokens
        const hashFragment = window.location.hash.substring(1);
        const params = new URLSearchParams(hashFragment);
        
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');

        if (access_token && refresh_token) {
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            console.error('Session error:', error);
            setError(error.message);
            setLoading(false);
            return;
          }

          // Handle specific callback types
          if (type === 'recovery') {
            // Password reset - redirect to reset password page
            router.push('/auth/reset-password');
            return;
          }

          if (type === 'invite') {
            // Team invite - redirect to invite handling
            const teamId = searchParams.get('team_id');
            const role = searchParams.get('role');
            if (teamId && role) {
              router.push(`/invite/callback?team_id=${teamId}&role=${role}`);
              return;
            }
          }

          // Sync user to database
          try {
            const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sync-user`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!syncResponse.ok) {
              console.warn('Failed to sync user to database');
            }
          } catch (syncError) {
            console.warn('User sync error:', syncError);
          }

          // Default redirect to dashboard
          router.push('/dashboard');
        } else {
          // No tokens found, redirect to login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError('Authentication failed');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
