-- Quick Database Check
-- Copy this and run in Supabase SQL Editor

SELECT 'USERS:' as check_type, COUNT(*) as count FROM users
UNION ALL
SELECT 'TEAMS:', COUNT(*) FROM teams
UNION ALL  
SELECT 'TEAM_MEMBERS:', COUNT(*) FROM team_members;

-- Show all users
SELECT 'All Users:' as info;
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- Show all teams
SELECT 'All Teams:' as info;
SELECT * FROM teams ORDER BY created_at DESC LIMIT 5;
