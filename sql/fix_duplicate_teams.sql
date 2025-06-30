-- ====================================
-- FIX DUPLICATE TEAMS IN get_user_teams_ultimate
-- This removes duplicates from the function
-- ====================================

-- Drop and recreate the function with proper deduplication
DROP FUNCTION IF EXISTS public.get_user_teams_ultimate(uuid);

CREATE OR REPLACE FUNCTION public.get_user_teams_ultimate(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(
    team_id uuid,
    team_name text,
    team_created_by uuid,
    team_created_at timestamptz,
    user_role text,
    is_creator boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH team_roles AS (
        -- Teams user created (they are the admin/creator)
        SELECT 
            t.id as team_id,
            t.name as team_name,
            t.created_by as team_created_by,
            t.created_at as team_created_at,
            'admin'::text as user_role,
            true as is_creator,
            1 as priority  -- Higher priority for creator role
        FROM public.teams t
        WHERE t.created_by = user_uuid
        
        UNION
        
        -- Teams user is a member of (but not creator)
        SELECT 
            t.id as team_id,
            t.name as team_name,
            t.created_by as team_created_by,
            t.created_at as team_created_at,
            tu.role as user_role,
            false as is_creator,
            2 as priority  -- Lower priority for member role
        FROM public.teams t
        JOIN public.team_users tu ON t.id = tu.team_id
        WHERE tu.user_id = user_uuid
        AND t.created_by != user_uuid  -- Exclude teams where user is already creator
    ),
    deduplicated AS (
        -- If user appears in both queries (creator + member), prefer creator role
        SELECT DISTINCT ON (tr.team_id)
            tr.team_id, tr.team_name, tr.team_created_by, tr.team_created_at, tr.user_role, tr.is_creator
        FROM team_roles tr
        ORDER BY tr.team_id, tr.priority ASC  -- Lower priority number = higher precedence
    )
    SELECT d.team_id, d.team_name, d.team_created_by, d.team_created_at, d.user_role, d.is_creator
    FROM deduplicated d
    ORDER BY d.team_created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_teams_ultimate(uuid) TO authenticated;

-- Test for duplicates
DO $$
DECLARE
    test_user_id uuid;
    team_count integer;
    distinct_team_count integer;
BEGIN
    -- Get a test user ID (if any exist)
    SELECT created_by INTO test_user_id FROM public.teams LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Count total results
        SELECT COUNT(*) INTO team_count 
        FROM public.get_user_teams_ultimate(test_user_id);
        
        -- Count distinct team IDs
        SELECT COUNT(DISTINCT team_id) INTO distinct_team_count 
        FROM public.get_user_teams_ultimate(test_user_id);
        
        IF team_count = distinct_team_count THEN
            RAISE NOTICE '✅ No duplicates found - function returns % unique teams', team_count;
        ELSE
            RAISE NOTICE '⚠️  Found duplicates: % total results, % unique teams', team_count, distinct_team_count;
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  No teams found to test with';
    END IF;
    
    RAISE NOTICE '🎉 get_user_teams_ultimate function updated to eliminate duplicates!';
END $$;
