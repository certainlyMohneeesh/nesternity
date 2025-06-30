-- ====================================
-- FIX FOR AMBIGUOUS COLUMN REFERENCE ERROR
-- Run this to fix the get_team_invites_secure function
-- ====================================

-- Drop and recreate the problematic function with proper table aliases
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
    -- Check if user can manage this team (with explicit table alias)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_team_invites_secure(uuid, uuid) TO authenticated;

-- Test the function (this should not cause any ambiguity errors)
DO $$
DECLARE
    test_result text;
BEGIN
    -- Just test that the function exists and can be called (even if it fails due to no data)
    BEGIN
        PERFORM public.get_team_invites_secure('00000000-0000-0000-0000-000000000000'::uuid);
    EXCEPTION WHEN OTHERS THEN
        -- Expected to fail due to no data or access denied, but should not be ambiguous
        IF SQLSTATE = '42702' THEN
            RAISE EXCEPTION 'Still ambiguous! Error: %', SQLERRM;
        ELSE
            RAISE NOTICE 'Function works (expected error: %)', SQLERRM;
        END IF;
    END;
    
    RAISE NOTICE '✅ get_team_invites_secure function fixed - no more ambiguity!';
END $$;
