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
        console.log('🔄 Auth Callback: Starting authentication process');
        
        // Ensure we're on the client side
        if (typeof window === 'undefined') {
          return;
        }

        // Check for OAuth code in URL parameters (PKCE flow)
        const code = searchParams.get('code');
        
        if (code) {
          console.log('🔑 Auth Callback: OAuth code found, exchanging for session...');
          
          // The session exchange should happen automatically via Supabase
          // Just check if we have a session now
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Auth Callback: Session error:', sessionError);
            setError(sessionError.message);
            setLoading(false);
            return;
          }

          if (!session) {
            // Session not found, try to refresh or handle error
            console.log('🔄 Auth Callback: No session found, attempting to establish...');
            
            // Wait a moment for Supabase to process
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
            
            if (retryError || !retrySession) {
              console.error('❌ Auth Callback: Failed to get session after retry');
              setError('Authentication failed. Please try logging in again.');
              setLoading(false);
              return;
            }
            
            console.log('✅ Auth Callback: Session established after retry');
          } else {
            console.log('✅ Auth Callback: Session found', {
              userId: session.user?.id,
              email: session.user?.email,
              provider: session.user?.app_metadata?.provider
            });
          }

          const user = session?.user;
          const access_token = session?.access_token;

          if (!user || !access_token) {
            console.error('❌ Auth Callback: No user or token');
            setError('Authentication failed. Please try logging in.');
            setLoading(false);
            return;
          }

          // Sync user to database (creates user record if doesn't exist)
          try {
            console.log('🔄 Auth Callback: Syncing user to database...');
            const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sync-user`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                // Include OAuth metadata for proper user creation
                fullName: user.user_metadata?.full_name || user.user_metadata?.name,
                avatarUrl: user.user_metadata?.avatar_url,
                provider: user.app_metadata?.provider
              })
            });
            
            if (syncResponse.ok) {
              console.log('✅ Auth Callback: User synced successfully');
            } else {
              const errorData = await syncResponse.json().catch(() => ({}));
              console.warn('⚠️ Auth Callback: Failed to sync user:', errorData);
            }
          } catch (syncError) {
            console.warn('⚠️ Auth Callback: User sync error:', syncError);
            // Continue anyway - user might already exist in DB
          }

          // Wait a bit to ensure session cookies are set
          await new Promise(resolve => setTimeout(resolve, 500));

          console.log('✅ Auth Callback: Redirecting to dashboard');
          // Force a hard navigation to ensure cookies are properly set
          window.location.href = '/dashboard';
          return;
        }

        // Get the hash fragment which contains the auth tokens (for email confirmation)
        const hashFragment = window.location.hash.substring(1);
        const params = new URLSearchParams(hashFragment);
        
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');
        const provider_token = params.get('provider_token');

        console.log('🔑 Auth Callback: Token check', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
          type,
          hasProviderToken: !!provider_token
        });

        if (access_token && refresh_token) {
          // Set the session with the tokens from the URL
          console.log('🔄 Auth Callback: Setting session...');
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (sessionError) {
            console.error('❌ Auth Callback: Session error:', sessionError);
            setError(sessionError.message);
            setLoading(false);
            return;
          }

          console.log('✅ Auth Callback: Session established', {
            userId: sessionData.user?.id,
            email: sessionData.user?.email,
            provider: sessionData.user?.app_metadata?.provider
          });

          // Handle specific callback types
          if (type === 'recovery') {
            console.log('🔄 Auth Callback: Password recovery flow');
            router.push('/auth/reset-password');
            return;
          }

          if (type === 'invite') {
            console.log('🔄 Auth Callback: Team invite flow');
            const teamId = searchParams.get('team_id');
            const role = searchParams.get('role');
            if (teamId && role) {
              router.push(`/invite/callback?team_id=${teamId}&role=${role}`);
              return;
            }
          }

          // For email confirmation (signup or email change) or OAuth sign-in
          if (type === 'signup' || type === 'email_change' || !type) {
            console.log('🔄 Auth Callback: Email confirmation/OAuth flow');
            
            // Verify the user is actually authenticated
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
              console.error('❌ Auth Callback: Failed to get user after session set', userError);
              setError('Authentication failed. Please try logging in.');
              setLoading(false);
              return;
            }

            console.log('✅ Auth Callback: User verified', {
              userId: user.id,
              email: user.email,
              emailConfirmed: user.email_confirmed_at,
              provider: user.app_metadata?.provider,
              fullName: user.user_metadata?.full_name,
              avatarUrl: user.user_metadata?.avatar_url
            });

            // Sync user to database (creates user record if doesn't exist)
            try {
              console.log('🔄 Auth Callback: Syncing user to database...');
              const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sync-user`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  // Include OAuth metadata for proper user creation
                  fullName: user.user_metadata?.full_name || user.user_metadata?.name,
                  avatarUrl: user.user_metadata?.avatar_url,
                  provider: user.app_metadata?.provider
                })
              });
              
              if (syncResponse.ok) {
                console.log('✅ Auth Callback: User synced successfully');
              } else {
                const errorData = await syncResponse.json().catch(() => ({}));
                console.warn('⚠️ Auth Callback: Failed to sync user:', errorData);
              }
            } catch (syncError) {
              console.warn('⚠️ Auth Callback: User sync error:', syncError);
              // Continue anyway - user might already exist in DB
            }

            // Wait a bit to ensure session cookies are set
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('✅ Auth Callback: Redirecting to dashboard');
            // Force a hard navigation to ensure cookies are properly set
            window.location.href = '/dashboard';
            return;
          }

          // Default redirect to dashboard for other types
          console.log('🔄 Auth Callback: Default redirect to dashboard');
          window.location.href = '/dashboard';
        } else {
          // No tokens found, redirect to login
          console.log('❌ Auth Callback: No tokens found, redirecting to login');
          router.push('/auth/login?error=no_tokens');
        }
      } catch (error) {
        console.error('❌ Auth Callback: Unexpected error:', error);
        setError('Authentication failed. Please try again.');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center max-w-md px-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Confirming your account...</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we sign you in and set up your account.
          </p>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Go to Login
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
