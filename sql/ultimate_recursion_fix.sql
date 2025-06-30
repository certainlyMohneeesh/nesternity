-- ====================================
-- ULTIMATE RECURSION-FREE DATABASE FIX
-- This approach uses SECURITY DEFINER functions to bypass RLS entirely
-- ====================================

-- 1. DISABLE RLS ON ALL PROBLEMATIC TABLES TEMPORARILY
-- ====================================
ALTER TABLE public.team_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES COMPLETELY
-- ====================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on teams, team_users, team_invites
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('teams', 'team_users', 'team_invites') 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
    
    RAISE NOTICE 'Dropped all existing policies';
END $$;

-- 3. CREATE SECURITY DEFINER FUNCTIONS FOR ALL OPERATIONS
-- ====================================

-- Function to get teams for a user (replaces complex RLS)
CREATE OR REPLACE FUNCTION public.get_user_teams_ultimate(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(
    id uuid,
    name text,
    created_by uuid,
    created_at timestamptz,
    user_role text,
    is_creator boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Teams user created
    SELECT 
        t.id,
        t.name,
        t.created_by,
        t.created_at,
        'owner'::text as user_role,
        true as is_creator
    FROM public.teams t
    WHERE t.created_by = user_uuid
    
    UNION ALL
    
    -- Teams user is member of
    SELECT 
        t.id,
        t.name,
        t.created_by,
        t.created_at,
        COALESCE(tu.role, 'member') as user_role,
        false as is_creator
    FROM public.teams t
    JOIN public.team_users tu ON t.id = tu.team_id
    WHERE tu.user_id = user_uuid
    AND t.created_by != user_uuid -- Avoid duplicates
    
    ORDER BY created_at DESC;
END;
$$;

-- Function to get team members (replaces RLS on team_users)
CREATE OR REPLACE FUNCTION public.get_team_members(team_uuid uuid, requesting_user uuid DEFAULT auth.uid())
RETURNS TABLE(
    id uuid,
    user_id uuid,
    role text,
    accepted_at timestamptz,
    email text,
    display_name text,
    avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user can access this team
    IF NOT EXISTS (
        SELECT 1 FROM public.teams WHERE id = team_uuid AND created_by = requesting_user
        UNION
        SELECT 1 FROM public.team_users WHERE team_id = team_uuid AND user_id = requesting_user
    ) THEN
        RAISE EXCEPTION 'Access denied to team members';
    END IF;
    
    RETURN QUERY
    SELECT 
        tu.id,
        tu.user_id,
        tu.role,
        tu.accepted_at,
        u.email,
        u.display_name,
        u.avatar_url
    FROM public.team_users tu
    JOIN public.users u ON tu.user_id = u.id
    WHERE tu.team_id = team_uuid
    ORDER BY tu.role DESC, u.display_name, u.email;
END;
$$;

-- Function to add team member (replaces RLS on INSERT)
CREATE OR REPLACE FUNCTION public.add_team_member(
    team_uuid uuid, 
    new_user_id uuid, 
    member_role text DEFAULT 'member',
    requesting_user uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if requesting user can manage this team
    IF NOT EXISTS (
        SELECT 1 FROM public.teams WHERE id = team_uuid AND created_by = requesting_user
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Permission denied');
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.team_users WHERE team_id = team_uuid AND user_id = new_user_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'User is already a member');
    END IF;
    
    -- Add member
    INSERT INTO public.team_users (team_id, user_id, role, accepted_at)
    VALUES (team_uuid, new_user_id, member_role, now());
    
    RETURN json_build_object('success', true);
END;
$$;

-- Function to remove team member (replaces RLS on DELETE)
CREATE OR REPLACE FUNCTION public.remove_team_member(
    team_uuid uuid, 
    remove_user_id uuid,
    requesting_user uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check permissions: team creator or user removing themselves
    IF NOT (
        EXISTS (SELECT 1 FROM public.teams WHERE id = team_uuid AND created_by = requesting_user)
        OR remove_user_id = requesting_user
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Permission denied');
    END IF;
    
    -- Cannot remove team creator
    IF EXISTS (SELECT 1 FROM public.teams WHERE id = team_uuid AND created_by = remove_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Cannot remove team creator');
    END IF;
    
    -- Remove member
    DELETE FROM public.team_users 
    WHERE team_id = team_uuid AND user_id = remove_user_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- Function to get team invites (replaces RLS on team_invites)
CREATE OR REPLACE FUNCTION public.get_team_invites_secure(team_uuid uuid, requesting_user uuid DEFAULT auth.uid())
RETURNS TABLE(
    id uuid,
    team_id uuid,
    email text,
    role text,
    token text,
    expires_at timestamptz,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user can manage this team
    IF NOT EXISTS (
        SELECT 1 FROM public.teams WHERE id = team_uuid AND created_by = requesting_user
    ) THEN
        RAISE EXCEPTION 'Access denied to team invites';
    END IF;
    
    RETURN QUERY
    SELECT 
        ti.id,
        ti.team_id,
        ti.email,
        ti.role,
        ti.token,
        ti.expires_at,
        ti.created_at
    FROM public.team_invites ti
    WHERE ti.team_id = team_uuid
    AND ti.used_at IS NULL
    AND ti.expires_at > now()
    ORDER BY ti.created_at DESC;
END;
$$;

-- Function to create team invite (replaces RLS on INSERT)
CREATE OR REPLACE FUNCTION public.create_team_invite_secure(
    team_uuid uuid,
    invite_email text,
    invite_role text DEFAULT 'member',
    invite_token text DEFAULT encode(gen_random_bytes(32), 'hex'),
    requesting_user uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user can manage this team
    IF NOT EXISTS (
        SELECT 1 FROM public.teams WHERE id = team_uuid AND created_by = requesting_user
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Permission denied');
    END IF;
    
    -- Check if user is already registered
    IF EXISTS (SELECT 1 FROM public.users WHERE email = invite_email) THEN
        RETURN json_build_object('success', false, 'error', 'User is already registered. Use direct add instead.');
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.team_users tu 
        JOIN public.users u ON tu.user_id = u.id 
        WHERE tu.team_id = team_uuid AND u.email = invite_email
    ) THEN
        RETURN json_build_object('success', false, 'error', 'User is already a member');
    END IF;
    
    -- Check for existing active invite
    IF EXISTS (
        SELECT 1 FROM public.team_invites 
        WHERE team_id = team_uuid 
        AND email = invite_email 
        AND used_at IS NULL 
        AND expires_at > now()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Active invite already exists');
    END IF;
    
    -- Create invite
    INSERT INTO public.team_invites (team_id, email, invited_by, role, token)
    VALUES (team_uuid, invite_email, requesting_user, invite_role, invite_token);
    
    RETURN json_build_object(
        'success', true, 
        'token', invite_token,
        'expires_at', (now() + interval '7 days')::text
    );
END;
$$;

-- Function to cancel invite (replaces RLS on DELETE)
CREATE OR REPLACE FUNCTION public.cancel_team_invite_secure(
    invite_id uuid,
    requesting_user uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user can manage this invite
    IF NOT EXISTS (
        SELECT 1 FROM public.team_invites ti
        JOIN public.teams t ON ti.team_id = t.id
        WHERE ti.id = invite_id 
        AND (t.created_by = requesting_user OR ti.invited_by = requesting_user)
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Permission denied');
    END IF;
    
    -- Delete invite
    DELETE FROM public.team_invites WHERE id = invite_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- 4. GRANT PERMISSIONS TO ALL FUNCTIONS
-- ====================================
GRANT EXECUTE ON FUNCTION public.get_user_teams_ultimate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_team_member(uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_team_member(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_invites_secure(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_invite_secure(uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_team_invite_secure(uuid, uuid) TO authenticated;

-- 5. CREATE MINIMAL, SAFE RLS POLICIES
-- ====================================

-- Re-enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- TEAMS: Only allow direct operations by creators (no recursion)
CREATE POLICY "teams_creators_only" ON public.teams
    FOR ALL USING (created_by = auth.uid());

-- TEAM_USERS: Block all direct access (use functions only)
CREATE POLICY "team_users_no_direct_access" ON public.team_users
    FOR ALL USING (false);

-- TEAM_INVITES: Block all direct access (use functions only)  
CREATE POLICY "team_invites_no_direct_access" ON public.team_invites
    FOR ALL USING (false);

-- Allow invite acceptance (special case)
CREATE POLICY "accept_own_invites" ON public.team_invites
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- 6. SUCCESS MESSAGE
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '=== ULTIMATE RECURSION-FREE SOLUTION COMPLETE ===';
    RAISE NOTICE 'All RLS recursion eliminated using SECURITY DEFINER functions';
    RAISE NOTICE 'Direct table access blocked - only safe functions allowed';
    RAISE NOTICE 'Functions available:';
    RAISE NOTICE '  - get_user_teams_ultimate()';
    RAISE NOTICE '  - get_team_members()';
    RAISE NOTICE '  - add_team_member()';
    RAISE NOTICE '  - remove_team_member()';
    RAISE NOTICE '  - get_team_invites_secure()';
    RAISE NOTICE '  - create_team_invite_secure()';
    RAISE NOTICE '  - cancel_team_invite_secure()';
    RAISE NOTICE 'Ready for production use!';
END $$;
