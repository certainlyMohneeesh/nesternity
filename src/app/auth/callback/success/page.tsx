"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallbackSuccess() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePostOAuth = async () => {
      try {
        console.log('🔄 OAuth Success: Checking session...');
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('❌ OAuth Success: No session found');
          setError('Session not found. Please try logging in again.');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }

        console.log('✅ OAuth Success: Session found', {
          userId: session.user?.id,
          email: session.user?.email,
          provider: session.user?.app_metadata?.provider
        });

        const user = session.user;
        const access_token = session.access_token;

        // Sync user to database
        try {
          console.log('🔄 OAuth Success: Syncing user to database...');
          const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sync-user`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fullName: user.user_metadata?.full_name || user.user_metadata?.name,
              avatarUrl: user.user_metadata?.avatar_url,
              provider: user.app_metadata?.provider
            })
          });
          
          if (syncResponse.ok) {
            console.log('✅ OAuth Success: User synced successfully');
          } else {
            const errorData = await syncResponse.json().catch(() => ({}));
            console.warn('⚠️ OAuth Success: Failed to sync user:', errorData);
          }
        } catch (syncError) {
          console.warn('⚠️ OAuth Success: User sync error:', syncError);
        }

        // Redirect to dashboard
        console.log('✅ OAuth Success: Redirecting to dashboard');
        window.location.href = '/dashboard';
        
      } catch (error) {
        console.error('❌ OAuth Success: Unexpected error:', error);
        setError('Authentication failed. Please try again.');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    };

    handlePostOAuth();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
        <div className="text-center max-w-md px-6">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="text-center max-w-md px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <h2 className="mt-6 text-xl font-semibold text-gray-900">Setting up your account...</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please wait while we complete the sign-in process.
        </p>
      </div>
    </div>
  );
}
