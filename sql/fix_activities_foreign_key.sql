-- ====================================
-- FIX ACTIVITIES TABLE FOREIGN KEY RELATIONSHIP
-- This fixes the relationship between activities and users tables
-- ====================================

-- First, check if activities table exists and has data
DO $$
DECLARE
    table_exists boolean;
    row_count integer;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activities'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Get row count
        SELECT COUNT(*) FROM public.activities INTO row_count;
        RAISE NOTICE 'Activities table exists with % rows', row_count;
        
        -- Show current foreign key constraints
        RAISE NOTICE 'Current foreign key constraints on activities table:';
        FOR record IN (
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'public.activities'::regclass 
            AND contype = 'f'
        ) LOOP
            RAISE NOTICE '- %: %', record.conname, record.definition;
        END LOOP;
    ELSE
        RAISE NOTICE 'Activities table does not exist - you need to run the table creation scripts first';
    END IF;
END $$;

-- If the table exists but has the wrong foreign key, fix it
DO $$
DECLARE
    table_exists boolean;
    constraint_exists boolean;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activities'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check if we have the wrong constraint (pointing to auth.users)
        SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'activities' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'user_id'
            AND ccu.table_name = 'users'
            AND ccu.table_schema = 'auth'
        ) INTO constraint_exists;
        
        IF constraint_exists THEN
            RAISE NOTICE 'Found foreign key pointing to auth.users - this needs to be fixed';
            
            -- Drop the old constraint (find its name first)
            FOR record IN (
                SELECT tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = 'activities' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND kcu.column_name = 'user_id'
                AND ccu.table_name = 'users'
                AND ccu.table_schema = 'auth'
            ) LOOP
                EXECUTE 'ALTER TABLE public.activities DROP CONSTRAINT ' || record.constraint_name;
                RAISE NOTICE 'Dropped constraint: %', record.constraint_name;
            END LOOP;
            
            -- Add new constraint pointing to public.users
            ALTER TABLE public.activities 
            ADD CONSTRAINT activities_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Added new foreign key: activities.user_id -> public.users.id';
        ELSE
            RAISE NOTICE 'Foreign key relationship looks correct already';
        END IF;
    END IF;
END $$;

-- Verify the fix worked
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICATION ===';
    
    -- Show current foreign key constraints
    FOR record IN (
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'public.activities'::regclass 
        AND contype = 'f'
        AND conname LIKE '%user_id%'
    ) LOOP
        RAISE NOTICE 'Foreign key: % -> %', record.conname, record.definition;
    END LOOP;
    
    RAISE NOTICE '✅ Activities table foreign key fix complete!';
    RAISE NOTICE 'You should now be able to use: users:user_id (display_name, email) in Supabase queries';
END $$;
