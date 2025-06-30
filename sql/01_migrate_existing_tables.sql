-- ====================================
-- NESTERNITY CRM DATABASE MIGRATION
-- Run this in your Supabase SQL Editor
-- ====================================

-- 1. ADD COLUMNS TO EXISTING TABLES
-- ====================================

-- Add columns to users table
DO $$ 
BEGIN
    -- Add display_name if it doesn't exist (you have 'name' instead)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='display_name') THEN
        ALTER TABLE public.users ADD COLUMN display_name TEXT;
        -- Copy existing name to display_name
        UPDATE public.users SET display_name = name WHERE name IS NOT NULL;
    END IF;
    
    -- Add created_at and updated_at if  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
        ALTER TABLE public.users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    RAISE NOTICE 'Updated users table';
END $$;

-- Add columns to teams table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='updated_at') THEN
        ALTER TABLE public.teams ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    RAISE NOTICE 'Updated teams table';
END $$;

-- Add columns to team_users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_users' AND column_name='created_at') THEN
        ALTER TABLE public.team_users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    RAISE NOTICE 'Updated team_users table';
END $$;

-- Add columns to boards table
DO $$ 
BEGIN
    -- Add created_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boards' AND column_name='created_by') THEN
        ALTER TABLE public.boards ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boards' AND column_name='updated_at') THEN
        ALTER TABLE public.boards ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    RAISE NOTICE 'Updated boards table';
END $$;

-- Add columns to board_columns table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='board_columns' AND column_name='created_at') THEN
        ALTER TABLE public.board_columns ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    RAISE NOTICE 'Updated board_columns table';
END $$;

-- Fix tasks table (you have 'assignee' instead of 'assignee_id')
DO $$ 
BEGIN
    -- Add columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assignee_id') THEN
        ALTER TABLE public.tasks ADD COLUMN assignee_id UUID REFERENCES auth.users(id);
        -- Copy existing assignee to assignee_id
        UPDATE public.tasks SET assignee_id = assignee WHERE assignee IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='created_by') THEN
        ALTER TABLE public.tasks ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='position') THEN
        ALTER TABLE public.tasks ADD COLUMN position INTEGER DEFAULT 0;
    END IF;
    
    RAISE NOTICE 'Updated tasks table';
END $$;

-- Add columns to clients table
DO $$ 
BEGIN
    -- Add team_id column (you have user_id instead)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='team_id') THEN
        ALTER TABLE public.clients ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
    
    -- Add created_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='created_by') THEN
        ALTER TABLE public.clients ADD COLUMN created_by UUID REFERENCES auth.users(id);
        -- Copy existing user_id to created_by
        UPDATE public.clients SET created_by = user_id WHERE user_id IS NOT NULL;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='updated_at') THEN
        ALTER TABLE public.clients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    RAISE NOTICE 'Updated clients table';
END $$;

-- 2. CREATE NEW TABLES
-- ====================================

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(team_id, email)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE INDEXES
-- ====================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON public.users(display_name);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_users_team_id ON public.team_users(team_id);
CREATE INDEX IF NOT EXISTS idx_team_users_user_id ON public.team_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_team_id ON public.clients(team_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_boards_team_id ON public.boards(team_id);
CREATE INDEX IF NOT EXISTS idx_boards_created_by ON public.boards(created_by);
CREATE INDEX IF NOT EXISTS idx_board_columns_board_id ON public.board_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON public.tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON public.tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON public.team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON public.team_invites(email);
CREATE INDEX IF NOT EXISTS idx_activities_team_id ON public.activities(team_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_activity_id ON public.notifications(activity_id);

-- 4. ENABLE ROW LEVEL SECURITY
-- ====================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. SUCCESS MESSAGE
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Added   columns to existing tables';
    RAISE NOTICE 'Created new tables: activities, team_invites, notifications';
    RAISE NOTICE 'Added performance indexes';
    RAISE NOTICE 'Enabled Row Level Security';
    RAISE NOTICE 'Next: Run 02_rls_policies.sql';
END $$;