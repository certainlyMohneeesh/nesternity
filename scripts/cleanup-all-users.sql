-- Quick Orphaned Users Cleanup
-- This deletes all users from the database so you can start fresh
-- Only run this if you've deleted all users from Supabase Auth

BEGIN;

-- Show current user count
SELECT COUNT(*) as user_count FROM users;

-- Delete all users (cascades to related tables)
DELETE FROM users;

-- Confirm deletion
SELECT COUNT(*) as user_count_after FROM users;

COMMIT;

-- Now new users can register without conflicts
