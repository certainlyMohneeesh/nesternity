-- ====================================
-- FUNCTIONS AND TRIGGERS
-- Run this AFTER running 01_migrate_existing_tables.sql and 02_rls_policies.sql
-- ====================================

-- 7. UTILITY FUNCTIONS
-- ====================================

-- Function to accept team invite
CREATE OR REPLACE FUNCTION public.accept_team_invite(invite_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record public.team_invites%ROWTYPE;
    user_email TEXT;
    result JSON;
BEGIN
    -- Get current user email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    -- Find and validate the invite
    SELECT * INTO invite_record 
    FROM public.team_invites 
    WHERE token = invite_token 
      AND email = user_email
      AND expires_at > NOW() 
      AND used_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired invite');
    END IF;
    
    -- Check if user is already a team member
    IF EXISTS (
        SELECT 1 FROM public.team_users 
        WHERE team_id = invite_record.team_id AND user_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Already a team member');
    END IF;
    
    -- Add user to team
    INSERT INTO public.team_users (team_id, user_id, role, accepted_at)
    VALUES (invite_record.team_id, auth.uid(), invite_record.role, NOW());
    
    -- Mark invite as used
    UPDATE public.team_invites 
    SET used_at = NOW() 
    WHERE id = invite_record.id;
    
    RETURN json_build_object(
        'success', true, 
        'team_id', invite_record.team_id,
        'role', invite_record.role
    );
END;
$$;

-- Function to create activity with notifications
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

-- Function to get team member count
CREATE OR REPLACE FUNCTION public.get_team_member_count(team_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    member_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_count
    FROM public.team_users
    WHERE team_users.team_id = get_team_member_count.team_id;
    
    RETURN COALESCE(member_count, 0);
END;
$$;

-- Function to check if user is team admin
CREATE OR REPLACE FUNCTION public.is_team_admin(team_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
    is_owner BOOLEAN := FALSE;
BEGIN
    -- Check if user is team owner
    SELECT EXISTS(
        SELECT 1 FROM public.teams 
        WHERE id = team_id AND created_by = user_id
    ) INTO is_owner;
    
    -- Check if user is team admin
    SELECT EXISTS(
        SELECT 1 FROM public.team_users 
        WHERE team_id = is_team_admin.team_id 
        AND user_id = is_team_admin.user_id 
        AND role = 'admin'
    ) INTO is_admin;
    
    RETURN is_owner OR is_admin;
END;
$$;

-- 8. TRIGGERS FOR AUTOMATIC ACTIONS
-- ====================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply update triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_boards_updated_at ON public.boards;
CREATE TRIGGER update_boards_updated_at
    BEFORE UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to automatically add team creator as admin
CREATE OR REPLACE FUNCTION public.add_team_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert the team creator as an admin
    INSERT INTO public.team_users (team_id, user_id, role, accepted_at)
    VALUES (NEW.id, NEW.created_by, 'admin', NOW());
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS add_team_creator_as_admin_trigger ON public.teams;
CREATE TRIGGER add_team_creator_as_admin_trigger
    AFTER INSERT ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.add_team_creator_as_admin();

-- 9. GRANT NECESSARY PERMISSIONS
-- ====================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(TEXT) TO anon;
