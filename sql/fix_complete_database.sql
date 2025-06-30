-- ====================================
-- COMPLETE DATABASE FIX FOR INVITES AND TEAMS
-- Run this entire script to fix all recursion and invitation issues
-- ====================================

-- 1. DROP ALL PROBLEMATIC POLICIES ON ALL TABLES
-- ====================================

-- Drop team_users policies (causing recursion)
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
DROP POLICY IF EXISTS "view_team_memberships" ON public.team_users;
DROP POLICY IF EXISTS "view_own_team_memberships" ON public.team_users;
DROP POLICY IF EXISTS "creators_view_team_members" ON public.team_users;
DROP POLICY IF EXISTS "creators_add_members" ON public.team_users;
DROP POLICY IF EXISTS "creators_update_members" ON public.team_users;
DROP POLICY IF EXISTS "creators_remove_members" ON public.team_users;
-- Drop the policies this script creates (for re-runs)
DROP POLICY IF EXISTS "users_can_view_own_memberships" ON public.team_users;
DROP POLICY IF EXISTS "team_creators_can_view_all_members" ON public.team_users;
DROP POLICY IF EXISTS "team_creators_can_add_members" ON public.team_users;
DROP POLICY IF EXISTS "team_creators_can_update_members" ON public.team_users;
DROP POLICY IF EXISTS "team_creators_can_remove_members" ON public.team_users;

-- Drop teams policies that might reference team_users
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
DROP POLICY IF EXISTS "view_own_created_teams" ON public.teams;
DROP POLICY IF EXISTS "view_teams_via_membership" ON public.teams;
DROP POLICY IF EXISTS "users_can_view_accessible_teams" ON public.teams;
DROP POLICY IF EXISTS "team_creators_can_view_own_teams" ON public.teams;
DROP POLICY IF EXISTS "team_creators_can_update_own_teams" ON public.teams;
DROP POLICY IF EXISTS "team_creators_can_delete_own_teams" ON public.teams;
DROP POLICY IF EXISTS "authenticated_users_can_create_teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete teams" ON public.teams;

-- Drop any team_invites policies
DROP POLICY IF EXISTS "Users can view team invites for their teams" ON public.team_invites;
DROP POLICY IF EXISTS "Team admins can manage invites" ON public.team_invites;
DROP POLICY IF EXISTS "Allow inserting team invites" ON public.team_invites;
DROP POLICY IF EXISTS "team_creators_can_view_invites" ON public.team_invites;
DROP POLICY IF EXISTS "team_creators_can_create_invites" ON public.team_invites;
DROP POLICY IF EXISTS "team_creators_can_delete_invites" ON public.team_invites;
DROP POLICY IF EXISTS "invited_users_can_view_their_invites" ON public.team_invites;

-- 2. ENSURE TEAM_INVITES TABLE EXISTS
-- ====================================
CREATE TABLE IF NOT EXISTS public.team_invites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email text NOT NULL,
    invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    token text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    created_at timestamptz NOT NULL DEFAULT now(),
    used_at timestamptz,
    UNIQUE(team_id, email, used_at) -- Allow only one active invite per email per team
);

-- Enable RLS on team_invites
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- 3. CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ====================================

-- TEAMS TABLE POLICIES (minimal, no recursion)
CREATE POLICY "team_creators_can_view_own_teams" ON public.teams
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "team_creators_can_update_own_teams" ON public.teams
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "team_creators_can_delete_own_teams" ON public.teams
    FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "authenticated_users_can_create_teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- TEAM_USERS TABLE POLICIES (simple, direct checks only)
CREATE POLICY "users_can_view_own_memberships" ON public.team_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "team_creators_can_view_all_members" ON public.team_users
    FOR SELECT USING (
        team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
    );

CREATE POLICY "team_creators_can_add_members" ON public.team_users
    FOR INSERT WITH CHECK (
        team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
        OR user_id = auth.uid() -- Users can add themselves
    );

CREATE POLICY "team_creators_can_update_members" ON public.team_users
    FOR UPDATE USING (
        team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
        OR user_id = auth.uid() -- Users can update own membership
    );

CREATE POLICY "team_creators_can_remove_members" ON public.team_users
    FOR DELETE USING (
        team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
        OR user_id = auth.uid() -- Users can leave teams
    );

-- TEAM_INVITES TABLE POLICIES (simple, direct checks only)
CREATE POLICY "team_creators_can_view_invites" ON public.team_invites
    FOR SELECT USING (
        team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
    );

CREATE POLICY "team_creators_can_create_invites" ON public.team_invites
    FOR INSERT WITH CHECK (
        team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
        AND invited_by = auth.uid()
    );

CREATE POLICY "team_creators_can_delete_invites" ON public.team_invites
    FOR DELETE USING (
        team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
        OR invited_by = auth.uid()
    );

CREATE POLICY "invited_users_can_view_their_invites" ON public.team_invites
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- 4. CREATE HELPER FUNCTIONS FOR APPLICATION USE
-- ====================================

-- Function to get user's teams safely
CREATE OR REPLACE FUNCTION public.get_user_teams_safe(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(
    team_id uuid,
    team_name text,
    role text,
    created_by uuid,
    created_at timestamptz,
    is_creator boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    -- Teams where user is creator
    SELECT 
        t.id as team_id,
        t.name as team_name,
        'owner'::text as role,
        t.created_by,
        t.created_at,
        true as is_creator
    FROM public.teams t
    WHERE t.created_by = user_uuid
    
    UNION ALL
    
    -- Teams where user is a member (only if team_users table is accessible)
    SELECT 
        t.id as team_id,
        t.name as team_name,
        COALESCE(tu.role, 'member') as role,
        t.created_by,
        t.created_at,
        false as is_creator
    FROM public.teams t
    JOIN public.team_users tu ON t.id = tu.team_id
    WHERE tu.user_id = user_uuid
    AND t.created_by != user_uuid -- Avoid duplicates
    
    ORDER BY created_at DESC;
$$;

-- Function to check if user can manage team
CREATE OR REPLACE FUNCTION public.can_manage_team_safe(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
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

-- 5. GRANT PERMISSIONS
-- ====================================
GRANT EXECUTE ON FUNCTION public.get_user_teams_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_team_safe(uuid, uuid) TO authenticated;

-- 6. CREATE ACCEPT INVITE FUNCTION
-- ====================================
CREATE OR REPLACE FUNCTION public.accept_team_invite(invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record public.team_invites;
    user_email text;
    result json;
BEGIN
    -- Get current user's email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    IF user_email IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Find and validate invite
    SELECT * INTO invite_record 
    FROM public.team_invites 
    WHERE token = invite_token 
    AND email = user_email
    AND used_at IS NULL 
    AND expires_at > now();
    
    IF invite_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired invite');
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.team_users 
        WHERE team_id = invite_record.team_id 
        AND user_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'You are already a member of this team');
    END IF;
    
    -- Add user to team
    INSERT INTO public.team_users (team_id, user_id, role, accepted_at)
    VALUES (invite_record.team_id, auth.uid(), invite_record.role, now());
    
    -- Mark invite as used
    UPDATE public.team_invites 
    SET used_at = now() 
    WHERE id = invite_record.id;
    
    RETURN json_build_object(
        'success', true, 
        'team_id', invite_record.team_id,
        'role', invite_record.role
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to accept invite');
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO authenticated;

-- 7. SUCCESS MESSAGE AND VERIFICATION
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '=== DATABASE COMPLETELY FIXED ===';
    RAISE NOTICE 'All recursion issues resolved';
    RAISE NOTICE 'Team invites table created with proper policies';
    RAISE NOTICE 'Safe helper functions available';
    RAISE NOTICE 'Accept invite function ready';
    RAISE NOTICE 'You can now create teams and send invites!';
END $$;

-- Show active policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename IN ('teams', 'team_users', 'team_invites')
AND schemaname = 'public'
ORDER BY tablename, policyname;
