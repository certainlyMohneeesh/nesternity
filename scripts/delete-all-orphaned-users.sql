-- Delete All Orphaned Users
-- This deletes users from your database that don't exist in Supabase Auth
-- Run this ONCE to clean up, then the app will work normally

BEGIN;

-- Show what will be deleted
SELECT 
  'Users that will be deleted:' as info;

SELECT 
  id,
  email,
  display_name,
  created_at
FROM users
ORDER BY created_at;

-- Delete ALL users (they will be recreated on next login)
DELETE FROM users;

SELECT 
  'All users deleted. They will be recreated when users log in.' as result;

COMMIT;
