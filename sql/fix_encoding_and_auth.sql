-- ====================================
-- FIX BASE64URL ENCODING AND USER LOOKUP ISSUES
-- Production-ready solution for PostgreSQL compatibility
-- ====================================

-- 1. FIX THE CREATE INVITE FUNCTION (base64url encoding issue)
-- ====================================
CREATE OR REPLACE FUNCTION public.create_team_invite_secure(
    p_team_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'member'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_requesting_user UUID;
    v_invite_token TEXT;
    v_invite_id UUID;
    v_team_name TEXT;
BEGIN
    -- Get the requesting user
    v_requesting_user := auth.uid();
    
    -- Check if user is authenticated
    IF v_requesting_user IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User must be authenticated');
    END IF;
    
    -- Check if user can invite to this team (team creator or admin)
    IF NOT EXISTS (
        SELECT 1 FROM public.teams t 
        WHERE t.id = p_team_id 
        AND t.created_by = v_requesting_user
    ) AND NOT EXISTS (
        SELECT 1 FROM public.team_users tu
        WHERE tu.team_id = p_team_id 
        AND tu.user_id = v_requesting_user 
        AND tu.role = 'admin'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Only team creators and admins can send invites');
    END IF;
    
    -- Check if user is already a member (check auth.users via auth schema)
    IF EXISTS (
        SELECT 1 FROM public.team_users tu
        WHERE tu.team_id = p_team_id 
        AND tu.user_id IN (
            SELECT au.id FROM auth.users au WHERE au.email = p_email
        )
    ) THEN
        RETURN json_build_object('success', false, 'error', 'User is already a team member');
    END IF;
    
    -- Check if there's already a pending invite
    IF EXISTS (
        SELECT 1 FROM public.team_invites ti 
        WHERE ti.team_id = p_team_id 
        AND ti.email = p_email 
        AND ti.used_at IS NULL 
        AND ti.expires_at > NOW()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Invite already exists for this email');
    END IF;
    
    -- Generate unique token using standard hex encoding (PostgreSQL compatible)
    v_invite_token := encode(gen_random_bytes(32), 'hex');
    
    -- Get team name
    SELECT t.name INTO v_team_name 
    FROM public.teams t 
    WHERE t.id = p_team_id;
    
    -- Insert invite
    INSERT INTO public.team_invites (
        team_id, 
        email, 
        invited_by, 
        role, 
        token,
        expires_at
    ) VALUES (
        p_team_id,
        p_email,
        v_requesting_user,
        p_role,
        v_invite_token,
        NOW() + INTERVAL '7 days'
    ) RETURNING id INTO v_invite_id;
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'token', v_invite_token,
        'invite_id', v_invite_id,
        'team_name', v_team_name,
        'expires_at', (NOW() + INTERVAL '7 days')::text
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', SQLERRM
        );
END;
$$;

-- 2. CREATE FUNCTION TO CHECK USER BY EMAIL IN AUTH.USERS
-- ====================================
CREATE OR REPLACE FUNCTION public.get_user_by_email_secure(
    p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_record RECORD;
    v_requesting_user UUID;
BEGIN
    -- Get the requesting user
    v_requesting_user := auth.uid();
    
    -- Check if user is authenticated
    IF v_requesting_user IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User must be authenticated');
    END IF;
    
    -- Look for user in auth.users (not public.users)
    SELECT au.id, au.email, au.raw_user_meta_data->>'display_name' as display_name
    INTO v_user_record
    FROM auth.users au 
    WHERE au.email = p_email;
    
    -- Return user if found
    IF v_user_record.id IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'user', json_build_object(
                'id', v_user_record.id,
                'email', v_user_record.email,
                'display_name', COALESCE(v_user_record.display_name, 'User')
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', SQLERRM
        );
END;
$$;

-- 3. GRANT PERMISSIONS
-- ====================================
GRANT EXECUTE ON FUNCTION public.create_team_invite_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_email_secure TO authenticated;

-- 4. VERIFICATION
-- ====================================
SELECT 'Functions updated with PostgreSQL-compatible encoding' as status;
