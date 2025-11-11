import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase client for AUTHENTICATION ONLY - Uses cookies for SSR compatibility
// Database operations go through Prisma + PostgreSQL
export const supabase: SupabaseClient = createBrowserClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    cookies: {
      getAll() {
        // Return empty array during SSR/pre-rendering
        if (typeof document === 'undefined') return [];
        
        return document.cookie
          .split('; ')
          .filter(Boolean)
          .map(cookie => {
            const [name, ...value] = cookie.split('=');
            return { name, value: value.join('=') };
          });
      },
      setAll(cookiesToSet) {
        // Skip during SSR/pre-rendering
        if (typeof document === 'undefined') return;
        
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=${options?.path || '/'}; ${
            options?.maxAge ? `max-age=${options.maxAge}` : ''
          }; ${options?.sameSite ? `samesite=${options.sameSite}` : ''}; ${
            options?.secure ? 'secure' : ''
          }`;
        });
      },
    },
  }
);

// Clean auth helpers
export const auth = {
  // Sign up
  signUp: async (email: string, password: string, metadata?: any) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  // Sign out
  signOut: async () => {
    return supabase.auth.signOut()
  },

  // Get current user
  getUser: async () => {
    return supabase.auth.getUser()
  },

  // Get session
  getSession: async () => {
    return supabase.auth.getSession()
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// For server-side (optionally use service role key)
export function createSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey);
}
