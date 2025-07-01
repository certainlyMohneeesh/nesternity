-- ====================================
-- FIX FUNCTION CONFLICTS - PRODUCTION READY
-- Remove all conflicting function versions and create clean, single versions
-- ====================================

-- 1. DROP ALL VERSIONS OF CONFLICTING FUNCTIONS
-- ====================================
DROP FUNCTION IF EXISTS public.create_team_invite_secure(uuid, text, text);
DROP FUNCTION IF EXISTS public.create_team_invite_secure(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.create_team_invite_secure(uuid, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.create_team_invite_secure(team_uuid uuid, invite_email text, invite_role text);
DROP FUNCTION IF EXISTS public.create_team_invite_secure(team_uuid uuid, invite_email text, invite_role text, invite_token text);
DROP FUNCTION IF EXISTS public.create_team_invite_secure(team_uuid uuid, invite_email text, invite_role text, invite_token text, requesting_user uuid);

DROP FUNCTION IF EXISTS public.cancel_team_invite_secure(uuid);
DROP FUNCTION IF EXISTS public.cancel_team_invite_secure(uuid, uuid);
DROP FUNCTION IF EXISTS public.cancel_team_invite_secure(invite_id uuid);
DROP FUNCTION IF EXISTS public.cancel_team_invite_secure(invite_id uuid, requesting_user uuid);

-- 2. CREATE SINGLE CLEAN INVITE FUNCTION
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
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.team_users tu 
        JOIN public.users u ON u.id = tu.user_id
        WHERE tu.team_id = p_team_id 
        AND u.email = p_email
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
    
    -- Generate unique token
    v_invite_token := encode(gen_random_bytes(32), 'base64url');
    
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

-- 3. CREATE SINGLE CLEAN CANCEL FUNCTION
-- ====================================
CREATE OR REPLACE FUNCTION public.cancel_team_invite_secure(
    p_invite_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_requesting_user UUID;
    v_invite_record RECORD;
BEGIN
    -- Get the requesting user
    v_requesting_user := auth.uid();
    
    -- Check if user is authenticated
    IF v_requesting_user IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User must be authenticated');
    END IF;
    
    -- Get invite details
    SELECT ti.*, t.created_by as team_creator
    INTO v_invite_record
    FROM public.team_invites ti
    JOIN public.teams t ON t.id = ti.team_id
    WHERE ti.id = p_invite_id;
    
    -- Check if invite exists
    IF v_invite_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invite not found');
    END IF;
    
    -- Check if user can cancel this invite (creator, inviter, or team admin)
    IF v_requesting_user != v_invite_record.invited_by 
       AND v_requesting_user != v_invite_record.team_creator
       AND NOT EXISTS (
           SELECT 1 FROM public.team_users tu
           WHERE tu.team_id = v_invite_record.team_id 
           AND tu.user_id = v_requesting_user 
           AND tu.role = 'admin'
       ) THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized to cancel this invite');
    END IF;
    
    -- Check if invite is already used
    IF v_invite_record.used_at IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invite has already been accepted');
    END IF;
    
    -- Delete the invite
    DELETE FROM public.team_invites 
    WHERE id = p_invite_id;
    
    RETURN json_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', SQLERRM
        );
END;
$$;

-- 4. GRANT PERMISSIONS
-- ====================================
GRANT EXECUTE ON FUNCTION public.create_team_invite_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_team_invite_secure TO authenticated;

-- 5. VERIFICATION
-- ====================================
SELECT 'create_team_invite_secure function created' as status;
SELECT 'cancel_team_invite_secure function created' as status;
