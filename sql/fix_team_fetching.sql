-- ====================================
-- PRODUCTION-READY TEAM FETCHING SOLUTION
-- Run this to ensure teams can be fetched properly on frontend
-- ====================================

-- 1. ENSURE THE HELPER FUNCTION EXISTS AND WORKS
-- ====================================

-- Drop and recreate the function to ensure it's correct
DROP FUNCTION IF EXISTS public.get_user_teams(uuid);

CREATE OR REPLACE FUNCTION public.get_user_teams(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(
    team_id uuid, 
    team_name text, 
    role text, 
    created_by uuid,
    created_at timestamptz,
    member_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        tu.team_id,
        t.name as team_name,
        tu.role,
        t.created_by,
        t.created_at,
        (SELECT COUNT(*) FROM public.team_users tu2 WHERE tu2.team_id = tu.team_id) as member_count
    FROM public.team_users tu
    JOIN public.teams t ON tu.team_id = t.id
    WHERE tu.user_id = user_uuid
    ORDER BY t.created_at DESC;
$$;

-- 2. ENSURE TEAMS TABLE HAS PROPER SELECT POLICY
-- ====================================

-- Drop existing teams select policies that might conflict
DROP POLICY IF EXISTS "view_own_created_teams" ON public.teams;
DROP POLICY IF EXISTS "view_teams_via_membership" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

-- Create a comprehensive teams select policy
CREATE POLICY "users_can_view_accessible_teams" ON public.teams
    FOR SELECT USING (
        -- User is the creator
        created_by = auth.uid()
        OR
        -- User is a member of the team
        id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

-- 3. ENSURE TEAM_USERS POLICIES ARE CORRECT
-- ====================================

-- Make sure team_users select policy allows viewing own memberships
DROP POLICY IF EXISTS "view_own_team_memberships" ON public.team_users;
DROP POLICY IF EXISTS "creators_view_team_members" ON public.team_users;
DROP POLICY IF EXISTS "Users can view team members for their teams" ON public.team_users;

-- Simple policy for viewing team memberships
CREATE POLICY "view_team_memberships" ON public.team_users
    FOR SELECT USING (
        -- User can see their own memberships
        user_id = auth.uid()
        OR
        -- User can see other members if they're in the same team
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

-- 4. CREATE ADDITIONAL HELPER FUNCTIONS
-- ====================================

-- Function to get all teams a user can see (created + member of)
CREATE OR REPLACE FUNCTION public.get_accessible_teams(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(
    id uuid,
    name text,
    created_by uuid,
    created_at timestamptz,
    user_role text,
    is_creator boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    -- Teams where user is creator
    SELECT 
        t.id,
        t.name,
        t.created_by,
        t.created_at,
        'owner'::text as user_role,
        true as is_creator
    FROM public.teams t
    WHERE t.created_by = user_uuid
    
    UNION
    
    -- Teams where user is a member
    SELECT 
        t.id,
        t.name,
        t.created_by,
        t.created_at,
        tu.role as user_role,
        false as is_creator
    FROM public.teams t
    JOIN public.team_users tu ON t.id = tu.team_id
    WHERE tu.user_id = user_uuid
    AND t.created_by != user_uuid  -- Avoid duplicates
    
    ORDER BY created_at DESC;
$$;

-- 5. GRANT PERMISSIONS
-- ====================================
GRANT EXECUTE ON FUNCTION public.get_user_teams(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_teams(uuid) TO authenticated;

-- 6. TEST THE FUNCTIONS
-- ====================================
DO $$
DECLARE
    test_user_id uuid;
    team_count integer;
BEGIN
    -- Get a test user (first authenticated user)
    SELECT auth.uid() INTO test_user_id;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the function
        SELECT COUNT(*) INTO team_count 
        FROM public.get_accessible_teams(test_user_id);
        
        RAISE NOTICE 'Found % teams for current user', team_count;
    ELSE
        RAISE NOTICE 'No authenticated user found for testing';
    END IF;
    
    RAISE NOTICE '=== TEAM FETCHING SETUP COMPLETE ===';
    RAISE NOTICE 'Functions created: get_user_teams, get_accessible_teams';
    RAISE NOTICE 'Policies updated for proper team visibility';
    RAISE NOTICE 'Frontend should now be able to fetch teams!';
END $$;

-- 7. VERIFY POLICIES
-- ====================================
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN char_length(qual) > 100 THEN left(qual, 97) || '...'
        ELSE qual 
    END as qual_preview
FROM pg_policies 
WHERE tablename IN ('teams', 'team_users')
AND schemaname = 'public'
ORDER BY tablename, policyname;
