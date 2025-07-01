import { supabase } from "./supabase";

/**
 * Safely get the current session without throwing errors
 * Returns null if session is invalid or expired
 */
export async function getSafeSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('Session error:', error.message);
      return null;
    }
    
    return session;
  } catch (error) {
    console.warn('Failed to get session:', error);
    return null;
  }
}

/**
 * Safely get the current user without throwing errors
 * Returns null if user is not authenticated or session is invalid
 */
export async function getSafeUser() {
  try {
    const session = await getSafeSession();
    return session?.user || null;
  } catch (error) {
    console.warn('Failed to get user:', error);
    return null;
  }
}
