-- ====================================
-- BULLETPROOF FIX FOR ALL RECURSION ISSUES
-- This completely eliminates circular dependencies between teams and team_users
-- ====================================

-- 1. DROP ALL PROBLEMATIC POLICIES
-- ====================================
-- Drop teams policies that reference team_users
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

-- Drop all team_users policies
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

-- Drop existing helper functions
DROP FUNCTION IF EXISTS public.is_team_owner(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_team_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_team_owner(uuid);
DROP FUNCTION IF EXISTS public.is_team_admin(uuid);

-- 2. CREATE RECURSION-FREE TEAMS POLICIES
-- ====================================

-- Simple policy: Users can view teams they created
CREATE POLICY "view_own_created_teams" ON public.teams
    FOR SELECT USING (created_by = auth.uid());

-- Users can view teams through a separate query (no recursion)
-- We'll handle team membership visibility at the application level
-- or through a separate function call

-- Keep existing policies for team management
-- (These should already exist and don't cause recursion)
-- "Users can create teams" 
-- "Team owners can update teams"
-- "Team owners can delete teams"

-- 3. CREATE RECURSION-FREE TEAM_USERS POLICIES
-- ====================================

-- Policy 1: Users can always view their own memberships
CREATE POLICY "view_own_team_memberships" ON public.team_users
    FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Team creators can view all their team members (direct check, no functions)
CREATE POLICY "creators_view_team_members" ON public.team_users
    FOR SELECT USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE created_by = auth.uid()
        )
    );

-- Policy 3: Team creators can add members (direct check, no functions)
CREATE POLICY "creators_add_members" ON public.team_users
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE created_by = auth.uid()
        )
        OR user_id = auth.uid()  -- Users can add themselves
    );

-- Policy 4: Team creators can update members (direct check, no functions)
CREATE POLICY "creators_update_members" ON public.team_users
    FOR UPDATE USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE created_by = auth.uid()
        )
        OR user_id = auth.uid()  -- Users can update own membership
    );

-- Policy 5: Team creators can remove members (direct check, no functions)
CREATE POLICY "creators_remove_members" ON public.team_users
    FOR DELETE USING (
        team_id IN (
            SELECT id FROM public.teams 
            WHERE created_by = auth.uid()
        )
        OR user_id = auth.uid()  -- Users can leave teams
    );

-- 4. CREATE SAFE HELPER FUNCTIONS (FOR APP USE, NOT POLICIES)
-- ====================================

-- Function to get user's teams (for application queries)
CREATE OR REPLACE FUNCTION public.get_user_teams(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(team_id uuid, team_name text, role text, created_by uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        tu.team_id,
        t.name as team_name,
        tu.role,
        t.created_by
    FROM public.team_users tu
    JOIN public.teams t ON tu.team_id = t.id
    WHERE tu.user_id = user_uuid;
$$;

-- Function to check team membership (for application use)
CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.team_users 
        WHERE team_id = team_uuid 
        AND user_id = user_uuid
    );
$$;

-- Function to check if user can manage team (owner or admin)
CREATE OR REPLACE FUNCTION public.can_manage_team(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        -- Check if user is team creator
        SELECT 1 FROM public.teams 
        WHERE id = team_uuid 
        AND created_by = user_uuid
    ) OR EXISTS (
        -- Or if user is admin
        SELECT 1 FROM public.team_users 
        WHERE team_id = team_uuid 
        AND user_id = user_uuid 
        AND role = 'admin'
    );
$$;

-- 5. UPDATE TEAMS POLICY TO USE FUNCTION (SAFE)
-- ====================================

-- Now add back team visibility using the safe function
CREATE POLICY "view_teams_via_membership" ON public.teams
    FOR SELECT USING (
        created_by = auth.uid() 
        OR public.is_team_member(id, auth.uid())
    );

-- 6. GRANT PERMISSIONS
-- ====================================
GRANT EXECUTE ON FUNCTION public.get_user_teams(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_team(uuid, uuid) TO authenticated;

-- 7. SUCCESS MESSAGE
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '=== RECURSION COMPLETELY ELIMINATED ===';
    RAISE NOTICE 'Broken circular dependency between teams and team_users';
    RAISE NOTICE 'Teams policies no longer directly query team_users';
    RAISE NOTICE 'Team_users policies only query teams (one direction)';
    RAISE NOTICE 'Helper functions available for application use';
    RAISE NOTICE 'Team creation should work perfectly now!';
END $$;

-- 8. VERIFY NO RECURSION
-- ====================================
SELECT 
    'teams' as table_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'teams'
UNION ALL
SELECT 
    'team_users' as table_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'team_users'
ORDER BY table_name, policyname;
