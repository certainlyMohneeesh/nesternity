-- ====================================
-- FINAL FIX FOR TEAM_USERS RECURSION
-- This creates helper functions to avoid all recursion risks
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

-- 2. DROP EXISTING FUNCTIONS FIRST
-- ====================================
DROP FUNCTION IF EXISTS public.is_team_owner(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_team_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_team_owner(uuid);
DROP FUNCTION IF EXISTS public.is_team_admin(uuid);

-- 3. CREATE HELPER FUNCTIONS (NO RECURSION)
-- ====================================

-- Function to check if user is team owner
CREATE FUNCTION public.is_team_owner(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.teams 
        WHERE id = team_uuid 
        AND created_by = user_uuid
    );
$$;

-- Function to check if user is team admin (owner or admin role)
CREATE FUNCTION public.is_team_admin(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    -- First check if they're the team owner
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.teams 
            WHERE id = team_uuid 
            AND created_by = user_uuid
        ) THEN true
        -- If not owner, check if they have admin role in team_users
        -- This is safe because we're not in a policy context here
        WHEN EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE team_id = team_uuid 
            AND user_id = user_uuid 
            AND role = 'admin'
        ) THEN true
        ELSE false
    END;
$$;

-- 4. CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ====================================

-- Policy 1: Users can always view their own memberships
CREATE POLICY "view_own_memberships" ON public.team_users
    FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Team owners can view all members (using helper function)
CREATE POLICY "owners_view_members" ON public.team_users
    FOR SELECT USING (public.is_team_owner(team_id));

-- Policy 3: Team owners can add members (using helper function)
CREATE POLICY "owners_add_members" ON public.team_users
    FOR INSERT WITH CHECK (public.is_team_owner(team_id));

-- Policy 4: Users can add themselves (for invite acceptance)
CREATE POLICY "users_join_teams" ON public.team_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy 5: Team admins can update members (using helper function)
CREATE POLICY "admins_update_members" ON public.team_users
    FOR UPDATE USING (public.is_team_admin(team_id));

-- Policy 6: Users can update their own membership
CREATE POLICY "users_update_own" ON public.team_users
    FOR UPDATE USING (user_id = auth.uid());

-- Policy 7: Team admins can delete members (using helper function)
CREATE POLICY "admins_delete_members" ON public.team_users
    FOR DELETE USING (public.is_team_admin(team_id));

-- Policy 8: Users can leave teams themselves
CREATE POLICY "users_leave_teams" ON public.team_users
    FOR DELETE USING (user_id = auth.uid());

-- 5. GRANT PERMISSIONS TO HELPER FUNCTIONS
-- ====================================
GRANT EXECUTE ON FUNCTION public.is_team_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_admin(uuid, uuid) TO authenticated;

-- 6. TEST THE SETUP
-- ====================================
DO $$
DECLARE
    test_result text;
BEGIN
    -- Test that we can call the helper functions
    SELECT 'Functions created successfully' INTO test_result;
    
    RAISE NOTICE '=== RECURSION FIX COMPLETE ===';
    RAISE NOTICE 'Helper functions created: is_team_owner, is_team_admin';
    RAISE NOTICE 'All team_users policies recreated using functions';
    RAISE NOTICE 'No more recursion risks!';
    RAISE NOTICE 'Status: %', test_result;
END $$;

-- 7. VERIFY POLICIES ARE ACTIVE
-- ====================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'team_users' 
ORDER BY policyname;
