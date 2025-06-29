-- ====================================
-- NOTIFICATIONS AND ACTIVITIES SYSTEM
-- This is included in 01_create_tables.sql
-- Run this only if you need to add notifications to existing database
-- ====================================

-- Create activities table for notifications and activity feed
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'task_created', 'task_updated', 'task_assigned', 'member_added', etc.
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table for user-specific notifications  
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_team_id ON public.activities(team_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for activities
DROP POLICY IF EXISTS "Users can view activities for their teams" ON public.activities;
CREATE POLICY "Users can view activities for their teams" ON public.activities
FOR SELECT USING (
    team_id IN (
        SELECT team_id FROM public.team_users 
        WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "Users can create activities" ON public.activities
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow creating notifications" ON public.notifications;
CREATE POLICY "Allow creating notifications" ON public.notifications
FOR INSERT WITH CHECK (TRUE);

-- Function to create activity and notify team members
CREATE OR REPLACE FUNCTION public.create_activity_with_notifications(
    p_user_id UUID DEFAULT auth.uid(),
    p_team_id UUID DEFAULT NULL,
    p_board_id UUID DEFAULT NULL,
    p_task_id UUID DEFAULT NULL,
    p_action_type TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activity_id UUID;
    member_record RECORD;
BEGIN
    -- Validate required parameters
    IF p_user_id IS NULL OR p_action_type IS NULL OR p_title IS NULL THEN
        RAISE EXCEPTION 'Missing required parameters';
    END IF;
    
    -- Create the activity
    INSERT INTO public.activities (user_id, team_id, board_id, task_id, action_type, title, description, metadata)
    VALUES (p_user_id, p_team_id, p_board_id, p_task_id, p_action_type, p_title, p_description, p_metadata)
    RETURNING id INTO activity_id;
    
    -- Create notifications for all team members except the actor (if team_id is provided)
    IF p_team_id IS NOT NULL THEN
        FOR member_record IN 
            SELECT user_id FROM public.team_users 
            WHERE team_id = p_team_id AND user_id != p_user_id
        LOOP
            INSERT INTO public.notifications (user_id, activity_id)
            VALUES (member_record.user_id, activity_id);
        END LOOP;
    END IF;
    
    RETURN activity_id;
END;
$$;
