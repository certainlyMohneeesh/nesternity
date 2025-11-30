import { createSupabaseServerClient } from './supabase-server';

/**
 * Safely get the current user in a server context (API routes, Server Components)
 * Returns null if user is not authenticated or session is invalid
 */
export async function getServerUser() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            // console.warn('Server auth error:', error.message);
            return null;
        }

        return user;
    } catch (error) {
        console.warn('Failed to get server user:', error);
        return null;
    }
}
