-- ====================================
-- ROW LEVEL SECURITY POLICIES
-- Run this AFTER running 01_create_tables.sql
-- ====================================

-- 5. RLS POLICIES FOR CORE TABLES
-- ====================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view other users (for team member display)
DROP POLICY IF EXISTS "Users can view other users" ON public.users;
CREATE POLICY "Users can view other users" ON public.users
    FOR SELECT USING (TRUE);

-- Teams table policies
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
CREATE POLICY "Users can view teams they belong to" ON public.teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Team owners can update teams" ON public.teams;
CREATE POLICY "Team owners can update teams" ON public.teams
    FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Team owners can delete teams" ON public.teams;
CREATE POLICY "Team owners can delete teams" ON public.teams
    FOR DELETE USING (auth.uid() = created_by);

-- Team users table policies
DROP POLICY IF EXISTS "Users can view team members for their teams" ON public.team_users;
CREATE POLICY "Users can view team members for their teams" ON public.team_users
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Team admins can manage team members" ON public.team_users;
CREATE POLICY "Team admins can manage team members" ON public.team_users
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR team_id IN (
            SELECT id FROM public.teams WHERE created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow inserting team members" ON public.team_users;
CREATE POLICY "Allow inserting team members" ON public.team_users
    FOR INSERT WITH CHECK (TRUE);

-- Clients table policies
DROP POLICY IF EXISTS "Users can view clients for their teams" ON public.clients;
CREATE POLICY "Users can view clients for their teams" ON public.clients
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage clients for their teams" ON public.clients;
CREATE POLICY "Users can manage clients for their teams" ON public.clients
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

-- Boards table policies
DROP POLICY IF EXISTS "Users can view boards for their teams" ON public.boards;
CREATE POLICY "Users can view boards for their teams" ON public.boards
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage boards for their teams" ON public.boards;
CREATE POLICY "Users can manage boards for their teams" ON public.boards
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

-- Board columns table policies
DROP POLICY IF EXISTS "Users can view board columns for their teams" ON public.board_columns;
CREATE POLICY "Users can view board columns for their teams" ON public.board_columns
    FOR SELECT USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.team_users tu ON b.team_id = tu.team_id
            WHERE tu.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage board columns for their teams" ON public.board_columns;
CREATE POLICY "Users can manage board columns for their teams" ON public.board_columns
    FOR ALL USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.team_users tu ON b.team_id = tu.team_id
            WHERE tu.user_id = auth.uid()
        )
    );

-- Tasks table policies
DROP POLICY IF EXISTS "Users can view tasks for their teams" ON public.tasks;
CREATE POLICY "Users can view tasks for their teams" ON public.tasks
    FOR SELECT USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.team_users tu ON b.team_id = tu.team_id
            WHERE tu.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage tasks for their teams" ON public.tasks;
CREATE POLICY "Users can manage tasks for their teams" ON public.tasks
    FOR ALL USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.team_users tu ON b.team_id = tu.team_id
            WHERE tu.user_id = auth.uid()
        )
    );

-- 6. RLS POLICIES FOR ADVANCED FEATURES
-- ====================================

-- Team invites table policies
DROP POLICY IF EXISTS "Users can view invites for their teams" ON public.team_invites;
CREATE POLICY "Users can view invites for their teams" ON public.team_invites
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid() AND role IN ('admin', 'member')
        )
    );

DROP POLICY IF EXISTS "Admins can create invites" ON public.team_invites;
CREATE POLICY "Admins can create invites" ON public.team_invites
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR team_id IN (
            SELECT id FROM public.teams WHERE created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can delete invites" ON public.team_invites;
CREATE POLICY "Admins can delete invites" ON public.team_invites
    FOR DELETE USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR team_id IN (
            SELECT id FROM public.teams WHERE created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow accepting invites" ON public.team_invites;
CREATE POLICY "Allow accepting invites" ON public.team_invites
    FOR UPDATE USING (
        expires_at > NOW() 
        AND used_at IS NULL
    );

-- Activities table policies
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

-- Notifications table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow creating notifications" ON public.notifications;
CREATE POLICY "Allow creating notifications" ON public.notifications
    FOR INSERT WITH CHECK (TRUE);
