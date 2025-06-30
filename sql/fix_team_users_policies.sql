-- ====================================
-- FIX INFINITE RECURSION IN TEAM_USERS POLICIES
-- Run this to fix the circular reference issue
-- ====================================

-- 1. DROP THE PROBLEMATIC TEAM_USERS POLICIES
-- ====================================
DROP POLICY IF EXISTS "Users can view team members for their teams" ON public.team_users;
DROP POLICY IF EXISTS "Team admins can manage team members" ON public.team_users;
DROP POLICY IF EXISTS "Allow inserting team members" ON public.team_users;

-- 2. CREATE PRODUCTION-READY NON-RECURSIVE TEAM_USERS POLICIES
-- ====================================
-- APPROACH: Never reference team_users table within team_users policies
-- Use only direct relationships to teams table and auth.uid()

-- Policy 1: Users can view their own team memberships (no recursion risk)
CREATE POLICY "Users can view own memberships" ON public.team_users
    FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Team owners can view all team members (direct teams table check)
CREATE POLICY "Team owners can view all members" ON public.team_users
    FOR SELECT USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE created_by = auth.uid()
        )
    );

-- Policy 3: Team owners can insert team members (direct teams table check)
CREATE POLICY "Team owners can add members" ON public.team_users
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE created_by = auth.uid()
        )
    );

-- Policy 4: Users can insert themselves (for invite acceptance)
CREATE POLICY "Users can join teams themselves" ON public.team_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy 5: Team owners can update team members (direct teams table check)
CREATE POLICY "Team owners can update members" ON public.team_users
    FOR UPDATE USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE created_by = auth.uid()
        )
    );

-- Policy 6: Users can update their own membership (role changes, etc.)
CREATE POLICY "Users can update own membership" ON public.team_users
    FOR UPDATE USING (user_id = auth.uid());

-- Policy 7: Team owners can delete team members (direct teams table check)
CREATE POLICY "Team owners can remove members" ON public.team_users
    FOR DELETE USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE created_by = auth.uid()
        )
    );

-- Policy 8: Users can remove themselves from teams
CREATE POLICY "Users can leave teams" ON public.team_users
    FOR DELETE USING (user_id = auth.uid());

-- 3. SUCCESS MESSAGE
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '=== TEAM_USERS POLICIES FIXED ===';
    RAISE NOTICE 'Removed recursive policies';
    RAISE NOTICE 'Added non-recursive policies using EXISTS';
    RAISE NOTICE 'Team creation should now work!';
END $$;