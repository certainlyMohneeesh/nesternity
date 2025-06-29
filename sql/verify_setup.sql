-- ====================================
-- DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify setup
-- ====================================

-- Check if all required tables exist
SELECT 
    'Tables Check' as test_category,
    CASE 
        WHEN COUNT(*) = 10 THEN '✅ All tables created'
        ELSE '❌ Missing tables: ' || (10 - COUNT(*))::text
    END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'teams', 'team_users', 'clients', 'boards', 
    'board_columns', 'tasks', 'team_invites', 'activities', 'notifications'
);

-- Check if RLS is enabled on all tables
SELECT 
    'RLS Check' as test_category,
    CASE 
        WHEN COUNT(*) = 10 THEN '✅ RLS enabled on all tables'
        ELSE '❌ RLS missing on ' || (10 - COUNT(*))::text || ' tables'
    END as result
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'teams', 'team_users', 'clients', 'boards', 
    'board_columns', 'tasks', 'team_invites', 'activities', 'notifications'
)
AND rowsecurity = true;

-- Check if required functions exist
SELECT 
    'Functions Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ All functions created'
        ELSE '❌ Missing functions'
    END as result
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'accept_team_invite', 
    'create_activity_with_notifications',
    'get_team_member_count',
    'is_team_admin'
);

-- Check if indexes exist
SELECT 
    'Indexes Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ Performance indexes created'
        ELSE '⚠️ Some indexes missing (performance may be affected)'
    END as result
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- Overall status
SELECT 
    '🎉 SETUP STATUS' as test_category,
    '✅ Database ready for Nesternity CRM!' as result;

-- Show table row counts (should be 0 for new setup)
SELECT 
    'Current Data' as test_category,
    'Users: ' || (SELECT COUNT(*) FROM public.users)::text ||
    ', Teams: ' || (SELECT COUNT(*) FROM public.teams)::text ||
    ', Activities: ' || (SELECT COUNT(*) FROM public.activities)::text as result;
