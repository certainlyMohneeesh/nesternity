/**
 * Shared authentication utilities for API routes
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

/**
 * Get authenticated user from cookies in API routes
 * Returns null if no valid session found
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('API Auth error:', error?.message || 'No user found');
      return null;
    }

    return user;
  } catch (error) {
    console.error('API Auth exception:', error);
    return null;
  }
}
