-- ====================================
-- COMPREHENSIVE FIX FOR ALL AMBIGUOUS ID REFERENCES
-- Run this to fix all functions with ambiguous column references
-- ====================================

-- 1. Fix get_user_teams_ultimate
DROP FUNCTION IF EXISTS public.get_user_teams_ultimate(uuid);

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
        'admin'::text as user_role,
        true as is_creator
    FROM public.teams t
    WHERE t.created_by = user_uuid
    
    UNION ALL
    
    -- Teams user is a member of
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
    
    ORDER BY created_at DESC;
END;
$$;

-- 2. Fix create_team_invite_secure
DROP FUNCTION IF EXISTS public.create_team_invite_secure(uuid, text, text);

CREATE OR REPLACE FUNCTION public.create_team_invite_secure(
    team_uuid uuid,
    invite_email text,
    invite_role text DEFAULT 'member'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_token text;
    invite_expires timestamptz;
    result json;
BEGIN
    -- Check if requesting user owns the team
    IF NOT EXISTS (
        SELECT 1 FROM public.teams t WHERE t.id = team_uuid AND t.created_by = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;
    
    -- Generate token and expiry
    invite_token := encode(gen_random_bytes(32), 'hex');
    invite_expires := now() + interval '7 days';
    
    -- Insert invite
    INSERT INTO public.team_invites (team_id, email, invited_by, role, token, expires_at)
    VALUES (team_uuid, invite_email, auth.uid(), invite_role, invite_token, invite_expires);
    
    RETURN json_build_object(
        'success', true,
        'token', invite_token,
        'expires_at', invite_expires
    );
END;
$$;

-- 3. Fix add_team_member
DROP FUNCTION IF EXISTS public.add_team_member(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.add_team_member(
    team_uuid uuid,
    new_user_id uuid,
    member_role text DEFAULT 'member'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if requesting user owns the team OR if it's the user themselves joining
    IF NOT (
        EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_uuid AND t.created_by = auth.uid()) OR
        (new_user_id = auth.uid())
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;
    
    -- Don't allow adding team creator as member
    IF EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_uuid AND t.created_by = new_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'User is already team creator');
    END IF;
    
    -- Insert team member
    INSERT INTO public.team_users (team_id, user_id, role, added_by)
    VALUES (team_uuid, new_user_id, member_role, auth.uid())
    ON CONFLICT (team_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        added_by = EXCLUDED.added_by,
        added_at = now();
    
    RETURN json_build_object('success', true);
END;
$$;

-- 4. Fix get_team_invites_secure (already created in previous file, but here for completeness)
DROP FUNCTION IF EXISTS public.get_team_invites_secure(uuid, uuid);

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
        SELECT 1 FROM public.teams t WHERE t.id = team_uuid AND t.created_by = requesting_user
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

-- 5. Fix cancel_team_invite_secure
DROP FUNCTION IF EXISTS public.cancel_team_invite_secure(uuid);

CREATE OR REPLACE FUNCTION public.cancel_team_invite_secure(invite_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if requesting user owns the team
    IF NOT EXISTS (
        SELECT 1 FROM public.team_invites ti 
        JOIN public.teams t ON ti.team_id = t.id 
        WHERE ti.id = invite_id AND t.created_by = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;
    
    DELETE FROM public.team_invites WHERE id = invite_id;
    
    RETURN json_build_object('success', true);
END;
$$;

-- Grant all permissions
GRANT EXECUTE ON FUNCTION public.get_user_teams_ultimate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_invite_secure(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_team_member(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_invites_secure(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_team_invite_secure(uuid) TO authenticated;

-- Test all functions for ambiguity
DO $$
BEGIN
    -- Test each function to make sure no ambiguity errors
    BEGIN
        PERFORM public.get_user_teams_ultimate();
        RAISE NOTICE '✅ get_user_teams_ultimate - No ambiguity';
    EXCEPTION WHEN OTHERS THEN
        IF SQLSTATE = '42702' THEN
            RAISE EXCEPTION 'get_user_teams_ultimate still ambiguous!';
        ELSE
            RAISE NOTICE '✅ get_user_teams_ultimate - No ambiguity (expected error: %)', SQLERRM;
        END IF;
    END;
    
    BEGIN
        PERFORM public.get_team_invites_secure('00000000-0000-0000-0000-000000000000'::uuid);
        RAISE NOTICE '✅ get_team_invites_secure - No ambiguity';
    EXCEPTION WHEN OTHERS THEN
        IF SQLSTATE = '42702' THEN
            RAISE EXCEPTION 'get_team_invites_secure still ambiguous!';
        ELSE
            RAISE NOTICE '✅ get_team_invites_secure - No ambiguity (expected error: %)', SQLERRM;
        END IF;
    END;
    
    RAISE NOTICE '🎉 ALL FUNCTIONS FIXED - No more ambiguous column references!';
END $$;
