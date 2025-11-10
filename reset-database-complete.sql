-- Complete Public Schema Reset for Supabase
-- This drops all tables in public schema but leaves auth schema intact
-- Note: This will delete all your app data but preserve auth users

-- Drop all foreign key constraints in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all foreign keys in public schema
    FOR r IN (
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all enums in public schema
    FOR r IN (
        SELECT t.typname as enumname
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.enumname) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences in public schema
    FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequencename) || ' CASCADE';
    END LOOP;
END $$;

-- Ensure public schema exists
CREATE SCHEMA IF NOT EXISTS public;

-- Grant necessary permissions on public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

SELECT 'Public schema reset complete. All app data deleted. Auth users preserved.' as status;
