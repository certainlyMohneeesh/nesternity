-- Quick Orphaned Users Cleanup
-- This deletes all users from the database so you can start fresh
-- Only run this if you've deleted all users from Supabase Auth

BEGIN;

-- Show current user count
SELECT COUNT(*) as user_count FROM users;

-- Delete all users (cascades to related tables)
DELETE FROM users;

-- Confirm deletion
SELECT COUNT(*) as user_count_anesternity/test-team-access.js nesternity/test-supabase-connection.js nesternity/test-sheets-api.js nesternity/test-proposal-status.js nesternity/test-json-parser.js nesternity/test-invoice.js nesternity/test-invoice-system.sh nesternity/test-budget-estimation.js nesternity/test-ai-estimation.js nesternity/sync-users.js nesternity/sync-user.js nesternity/sync-helper.sh nesternity/setup.sh nesternity/setup-razorpay.sh nesternity/setup-newsletter.sh nesternity/setup-db.sh nesternity/SETUP_STEPS.sh nesternity/seed.js nesternity/reset-and-migrate.sh nesternity/fix-team-ownership.js nesternity/fix-lint-issues.sh nesternity/diagnose-supabase.js nesternity/debug-projects.js nesternity/complete-fresh-start.sh nesternity/check-users.js nesternity/check-user-data.js nesternity/check-data.js nesternity/check-all-projects.js nesternity/budget-estimation-summary.sh nesternity/add-tasks.jsfter FROM users;

COMMIT;

-- Now new users can register without conflicts
