-- ====================================
-- ULTRA-SIMPLE FIX FOR TEAM_USERS RECURSION
-- Uses only team ownership (no role-based checks)
-- ====================================

-- 1. DROP ALL EXISTING TEAM_USERS POLICIES
-- ====================================
DROP POLICY IF EXISTS "Users can view team members for their teams" ON public.team_users;
DROP POLICY IF EXISTS "Team admins can manage team members" ON public.team_users;
DROP POLICY IF EXISTS "Allow inserting team members" ON public.team_users;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.team_users;
DROP POLICY IF EXISTS "Team owners can view all members" ON public.team_users;
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_users;
DROP POLICY IF EXISTS "Users can join teams themselves" ON public.team_users;
DROP POLICY IF EXISTS "Team owners can update members" ON public.team_users;
DROP POLICY IF EXISTS "Users can update own membership" ON public.team_users;
DROP POLICY IF EXISTS "Team owners can remove members" ON public.team_users;
DROP POLICY IF EXISTS "Users can leave teams" ON public.team_users;
DROP POLICY IF EXISTS "view_own_memberships" ON public.team_users;
DROP POLICY IF EXISTS "owners_view_members" ON public.team_users;
DROP POLICY IF EXISTS "owners_add_members" ON public.team_users;
DROP POLICY IF EXISTS "users_join_teams" ON public.team_users;
DROP POLICY IF EXISTS "admins_update_members" ON public.team_users;
DROP POLICY IF EXISTS "users_update_own" ON public.team_users;
DROP POLICY IF EXISTS "admins_delete_members" ON public.team_users;
DROP POLICY IF EXISTS "users_leave_teams" ON public.team_users;

-- 2. CREATE ULTRA-SIMPLE POLICIES (OWNER-ONLY)
-- ====================================

-- Policy 1: Users can view their own memberships
CREATE POLICY "user_own_membership_select" ON public.team_users
    FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Team creators can view all their team members
CREATE POLICY "creator_view_team_members" ON public.team_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE teams.id = team_users.team_id 
            AND teams.created_by = auth.uid()
        )
    );

-- Policy 3: Team creators can add members
CREATE POLICY "creator_add_members" ON public.team_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE teams.id = team_id 
            AND teams.created_by = auth.uid()
        )
    );

-- Policy 4: Users can add themselves (invite acceptance)
CREATE POLICY "user_self_join" ON public.team_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy 5: Team creators can update members
CREATE POLICY "creator_update_members" ON public.team_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE teams.id = team_users.team_id 
            AND teams.created_by = auth.uid()
        )
    );

-- Policy 6: Users can update their own membership
CREATE POLICY "user_update_own" ON public.team_users
    FOR UPDATE USING (user_id = auth.uid());

-- Policy 7: Team creators can remove members
CREATE POLICY "creator_remove_members" ON public.team_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE teams.id = team_users.team_id 
            AND teams.created_by = auth.uid()
        )
    );

-- Policy 8: Users can leave teams
CREATE POLICY "user_leave_team" ON public.team_users
    FOR DELETE USING (user_id = auth.uid());

-- 3. SUCCESS MESSAGE
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '=== SIMPLE RECURSION FIX COMPLETE ===';
    RAISE NOTICE 'All policies use simple EXISTS with teams table';
    RAISE NOTICE 'No functions, no recursion risks';
    RAISE NOTICE 'Only team creators (not admins) can manage members';
    RAISE NOTICE 'Try creating a team now!';
END $$;
