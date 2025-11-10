-- Verify Data in Database
-- Run this in Supabase SQL Editor to confirm data exists

-- Check users
SELECT 
    id,
    email,
    display_name,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Check teams
SELECT 
    id,
    name,
    description,
    created_by,
    created_at
FROM teams
ORDER BY created_at DESC
LIMIT 10;

-- Count total records
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM teams) as total_teams;

-- Check if specific user exists
SELECT * FROM users WHERE id = '56d1b836-bb3d-49e6-b193-4555c75b665d';

-- Check teams for specific user
SELECT t.*
FROM teams t
WHERE t.created_by = '56d1b836-bb3d-49e6-b193-4555c75b665d';
