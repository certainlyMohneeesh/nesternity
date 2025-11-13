"use client";

import { createBrowserClient } from '@supabase/ssr';

// Create a proper browser client for client components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Helper to get session token for API calls
export async function getSessionToken(): Promise<string | null> {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Client Session] Error getting session:', error);
      return null;
    }
    
    if (!session?.access_token) {
      console.warn('[Client Session] No access token in session');
      return null;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('[Client Session] Exception getting session:', error);
    return null;
  }
}
