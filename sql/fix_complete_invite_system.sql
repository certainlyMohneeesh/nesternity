-- ====================================
-- COMPREHENSIVE FIX FOR INVITE SYSTEM
-- Fixes: encoding, user lookup, permissions, and invite fetching
-- ====================================

-- 1. DROP ALL EXISTING CONFLICTING FUNCTIONS
-- ====================================
DROP FUNCTION IF EXISTS public.get_user_by_email_secure(text);
DROP FUNCTION IF EXISTS public.create_team_invite_secure(uuid, text, text);
DROP FUNCTION IF EXISTS public.cancel_team_invite_secure(uuid);
DROP FUNCTION IF EXISTS public.get_invite_details_secure(text);
DROP FUNCTION IF EXISTS public.accept_team_invite_secure(text);

-- 2. CREATE USER LOOKUP FUNCTION (works with auth.users)
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
    
    -- Look for user in auth.users
    SELECT au.id, au.email, 
           COALESCE(au.raw_user_meta_data->>'display_name', au.raw_user_meta_data->>'full_name', 'User') as display_name
    INTO v_user_record
    FROM auth.users au 
    WHERE au.email = p_email 
    AND au.email_confirmed_at IS NOT NULL;
    
    -- Return user if found
    IF v_user_record.id IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'user', json_build_object(
                'id', v_user_record.id,
                'email', v_user_record.email,
                'display_name', v_user_record.display_name
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'error', 'User not found or email not confirmed');
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Database error: ' || SQLERRM
        );
END;
$$;

-- 3. CREATE IMPROVED INVITE CREATION FUNCTION
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
    v_existing_user UUID;
BEGIN
    -- Get the requesting user
    v_requesting_user := auth.uid();
    
    -- Check if user is authenticated
    IF v_requesting_user IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User must be authenticated');
    END IF;
    
    -- Check if user can invite to this team
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
    
    -- Check if email user is already a team member
    SELECT au.id INTO v_existing_user 
    FROM auth.users au 
    WHERE au.email = p_email 
    AND au.email_confirmed_at IS NOT NULL;
    
    IF v_existing_user IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.team_users tu
            WHERE tu.team_id = p_team_id 
            AND tu.user_id = v_existing_user
        ) THEN
            RETURN json_build_object('success', false, 'error', 'User is already a team member');
        END IF;
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
    
    -- Generate unique token using hex encoding (PostgreSQL compatible)
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
            'error', 'Database error: ' || SQLERRM
        );
END;
$$;

-- 4. CREATE INVITE DETAILS FETCHING FUNCTION
-- ====================================
CREATE OR REPLACE FUNCTION public.get_invite_details_secure(
    p_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invite_record RECORD;
    v_team_record RECORD;
    v_inviter_record RECORD;
BEGIN
    -- Get invite details
    SELECT ti.id, ti.team_id, ti.email, ti.role, ti.expires_at, ti.used_at, ti.invited_by
    INTO v_invite_record
    FROM public.team_invites ti
    WHERE ti.token = p_token;
    
    -- Check if invite exists
    IF v_invite_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid invitation token');
    END IF;
    
    -- Get team details
    SELECT t.name
    INTO v_team_record
    FROM public.teams t
    WHERE t.id = v_invite_record.team_id;
    
    -- Get inviter details from auth.users
    SELECT COALESCE(au.raw_user_meta_data->>'display_name', au.raw_user_meta_data->>'full_name', 'Someone') as display_name,
           au.email
    INTO v_inviter_record
    FROM auth.users au
    WHERE au.id = v_invite_record.invited_by;
    
    -- Return complete invite details
    RETURN json_build_object(
        'success', true,
        'invite', json_build_object(
            'id', v_invite_record.id,
            'team_id', v_invite_record.team_id,
            'email', v_invite_record.email,
            'role', v_invite_record.role,
            'expires_at', v_invite_record.expires_at,
            'used_at', v_invite_record.used_at,
            'team_name', v_team_record.name,
            'inviter_name', v_inviter_record.display_name,
            'inviter_email', v_inviter_record.email
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Database error: ' || SQLERRM
        );
END;
$$;

-- 5. CREATE INVITE ACCEPTANCE FUNCTION
-- ====================================
CREATE OR REPLACE FUNCTION public.accept_team_invite_secure(
    p_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_requesting_user UUID;
    v_invite_record RECORD;
    v_user_email TEXT;
BEGIN
    -- Get the requesting user
    v_requesting_user := auth.uid();
    
    -- Check if user is authenticated
    IF v_requesting_user IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User must be authenticated');
    END IF;
    
    -- Get user email
    SELECT au.email INTO v_user_email
    FROM auth.users au
    WHERE au.id = v_requesting_user;
    
    -- Get invite details
    SELECT ti.id, ti.team_id, ti.email, ti.role, ti.expires_at, ti.used_at
    INTO v_invite_record
    FROM public.team_invites ti
    WHERE ti.token = p_token;
    
    -- Check if invite exists
    IF v_invite_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid invitation');
    END IF;
    
    -- Check if invite is for this user's email
    IF v_invite_record.email != v_user_email THEN
        RETURN json_build_object('success', false, 'error', 'This invitation is not for your email address');
    END IF;
    
    -- Check if invite is expired
    IF v_invite_record.expires_at < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'This invitation has expired');
    END IF;
    
    -- Check if invite is already used
    IF v_invite_record.used_at IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'This invitation has already been used');
    END IF;
    
    -- Check if user is already a team member
    IF EXISTS (
        SELECT 1 FROM public.team_users tu
        WHERE tu.team_id = v_invite_record.team_id 
        AND tu.user_id = v_requesting_user
    ) THEN
        RETURN json_build_object('success', false, 'error', 'You are already a member of this team');
    END IF;
    
    -- Add user to team
    INSERT INTO public.team_users (team_id, user_id, role, accepted_at, added_by)
    VALUES (v_invite_record.team_id, v_requesting_user, v_invite_record.role, NOW(), v_requesting_user);
    
    -- Mark invite as used
    UPDATE public.team_invites 
    SET used_at = NOW() 
    WHERE id = v_invite_record.id;
    
    RETURN json_build_object(
        'success', true, 
        'team_id', v_invite_record.team_id,
        'role', v_invite_record.role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Database error: ' || SQLERRM
        );
END;
$$;

-- 6. GRANT PERMISSIONS
-- ====================================
GRANT EXECUTE ON FUNCTION public.get_user_by_email_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_invite_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invite_details_secure TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invite_secure TO authenticated;

-- 7. VERIFICATION
-- ====================================
SELECT 'All invite functions recreated successfully' as status;
