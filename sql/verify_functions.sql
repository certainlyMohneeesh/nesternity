-- ====================================
-- VERIFY ULTIMATE RECURSION FIX FUNCTIONS
-- Run this to check if all functions were created properly
-- ====================================

-- 1. CHECK IF FUNCTIONS EXIST
-- ====================================
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%team%'
ORDER BY routine_name;

-- 2. CHECK FUNCTION SIGNATURES
-- ====================================
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%team%'
ORDER BY p.proname;

-- 3. TEST BASIC FUNCTION CALLS (safely)
-- ====================================
DO $$
DECLARE
    test_result text;
    func_exists boolean;
BEGIN
    -- Test if get_user_teams_ultimate exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_user_teams_ultimate'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE '✅ get_user_teams_ultimate function exists';
    ELSE
        RAISE NOTICE '❌ get_user_teams_ultimate function MISSING';
    END IF;
    
    -- Test if get_team_invites_secure exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_team_invites_secure'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE '✅ get_team_invites_secure function exists';
    ELSE
        RAISE NOTICE '❌ get_team_invites_secure function MISSING';
    END IF;
    
    -- Test if create_team_invite_secure exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'create_team_invite_secure'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE '✅ create_team_invite_secure function exists';
    ELSE
        RAISE NOTICE '❌ create_team_invite_secure function MISSING';
    END IF;
    
    RAISE NOTICE '=== FUNCTION VERIFICATION COMPLETE ===';
END $$;

-- 4. CHECK TABLE POLICIES
-- ====================================
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN char_length(qual) > 50 THEN left(qual, 47) || '...'
        ELSE qual 
    END as qual_preview
FROM pg_policies 
WHERE tablename IN ('teams', 'team_users', 'team_invites')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. CHECK IF TEAM_INVITES TABLE EXISTS WITH PROPER STRUCTURE
-- ====================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'team_invites'
ORDER BY ordinal_position;
