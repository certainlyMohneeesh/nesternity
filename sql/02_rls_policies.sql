-- ====================================
-- ROW LEVEL SECURITY POLICIES
-- Run this AFTER running 01_migrate_existing_tables.sql
-- ====================================

-- 1. DROP ALL EXISTING POLICIES FIRST
-- ====================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on public tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
    RAISE NOTICE 'Dropped all existing policies';
END $$;

-- 2. USERS TABLE POLICIES
-- ====================================
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view other users (for team member display, assignee selection)
CREATE POLICY "Users can view other users for teams" ON public.users
    FOR SELECT USING (
        TRUE -- Allow viewing all users for now, can be restricted later
    );

-- 3. TEAMS TABLE POLICIES
-- ====================================
CREATE POLICY "Users can view teams they belong to" ON public.teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners can update teams" ON public.teams
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Team owners can delete teams" ON public.teams
    FOR DELETE USING (auth.uid() = created_by);

-- 4. TEAM_USERS TABLE POLICIES
-- ====================================
CREATE POLICY "Users can view team members for their teams" ON public.team_users
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

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

CREATE POLICY "Allow inserting team members" ON public.team_users
    FOR INSERT WITH CHECK (
        -- Allow if user is admin of the team or team owner
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR team_id IN (
            SELECT id FROM public.teams WHERE created_by = auth.uid()
        )
        OR user_id = auth.uid() -- Allow users to add themselves (for invite acceptance)
    );

-- 5. CLIENTS TABLE POLICIES
-- ====================================
CREATE POLICY "Users can view clients for their teams" ON public.clients
    FOR SELECT USING (
        -- If team_id exists, check team membership
        (team_id IS NOT NULL AND team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        ))
        OR 
        -- If no team_id, check if user created it (legacy support)
        (team_id IS NULL AND (created_by = auth.uid() OR user_id = auth.uid()))
    );

CREATE POLICY "Users can manage clients for their teams" ON public.clients
    FOR ALL USING (
        -- If team_id exists, check team membership
        (team_id IS NOT NULL AND team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        ))
        OR 
        -- If no team_id, check if user created it (legacy support)
        (team_id IS NULL AND (created_by = auth.uid() OR user_id = auth.uid()))
    );

-- 6. BOARDS TABLE POLICIES
-- ====================================
CREATE POLICY "Users can view boards for their teams" ON public.boards
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage boards for their teams" ON public.boards
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM public.team_users 
            WHERE user_id = auth.uid()
        )
    );

-- 7. BOARD_COLUMNS TABLE POLICIES
-- ====================================
CREATE POLICY "Users can view board columns for their teams" ON public.board_columns
    FOR SELECT USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.team_users tu ON b.team_id = tu.team_id
            WHERE tu.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage board columns for their teams" ON public.board_columns
    FOR ALL USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.team_users tu ON b.team_id = tu.team_id
            WHERE tu.user_id = auth.uid()
        )
    );

-- 8. TASKS TABLE POLICIES
-- ====================================
CREATE POLICY "Users can view tasks for their teams" ON public.tasks
    FOR SELECT USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.team_users tu ON b.team_id = tu.team_id
            WHERE tu.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage tasks for their teams" ON public.tasks
    FOR ALL USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.team_users tu ON b.team_id = tu.team_id
            WHERE tu.user_id = auth.uid()
        )
    );

-- 9. TEAM_INVITES TABLE POLICIES (if table exists)
-- ====================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_invites') THEN
        -- Team invites policies
        EXECUTE 'CREATE POLICY "Users can view invites for their teams" ON public.team_invites
            FOR SELECT USING (
                team_id IN (
                    SELECT team_id FROM public.team_users 
                    WHERE user_id = auth.uid() AND role IN (''admin'', ''member'')
                )
            )';

        EXECUTE 'CREATE POLICY "Admins can create invites" ON public.team_invites
            FOR INSERT WITH CHECK (
                team_id IN (
                    SELECT team_id FROM public.team_users 
                    WHERE user_id = auth.uid() AND role = ''admin''
                )
                OR team_id IN (
                    SELECT id FROM public.teams WHERE created_by = auth.uid()
                )
            )';

        EXECUTE 'CREATE POLICY "Admins can delete invites" ON public.team_invites
            FOR DELETE USING (
                team_id IN (
                    SELECT team_id FROM public.team_users 
                    WHERE user_id = auth.uid() AND role = ''admin''
                )
                OR team_id IN (
                    SELECT id FROM public.teams WHERE created_by = auth.uid()
                )
            )';

        EXECUTE 'CREATE POLICY "Allow accepting invites" ON public.team_invites
            FOR UPDATE USING (
                expires_at > NOW() 
                AND used_at IS NULL
            )';
            
        RAISE NOTICE 'Created team_invites policies';
    END IF;
END $$;

-- 10. ACTIVITIES TABLE POLICIES (if table exists)
-- ====================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        EXECUTE 'CREATE POLICY "Users can view activities for their teams" ON public.activities
            FOR SELECT USING (
                team_id IN (
                    SELECT team_id FROM public.team_users 
                    WHERE user_id = auth.uid()
                )
                OR user_id = auth.uid()
            )';

        EXECUTE 'CREATE POLICY "Users can create activities" ON public.activities
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
            
        RAISE NOTICE 'Created activities policies';
    END IF;
END $$;

-- 11. NOTIFICATIONS TABLE POLICIES (if table exists)
-- ====================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        EXECUTE 'CREATE POLICY "Users can view their own notifications" ON public.notifications
            FOR SELECT USING (user_id = auth.uid())';

        EXECUTE 'CREATE POLICY "Users can update their own notifications" ON public.notifications
            FOR UPDATE USING (user_id = auth.uid())';

        EXECUTE 'CREATE POLICY "Allow creating notifications" ON public.notifications
            FOR INSERT WITH CHECK (TRUE)';
            
        RAISE NOTICE 'Created notifications policies';
    END IF;
END $$;

-- 12. SPECIAL HANDLING FOR LEGACY DATA
-- ====================================

-- Allow reading users by email for invite system
CREATE POLICY "Allow finding users by email for invites" ON public.users
    FOR SELECT USING (
        auth.uid() IS NOT NULL -- Any authenticated user can search for users by email
    );

-- 13. SUCCESS MESSAGE
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '=== RLS POLICIES SETUP COMPLETED ===';
    RAISE NOTICE 'Created policies for existing tables:';
    RAISE NOTICE '- users, teams, team_users, clients';
    RAISE NOTICE '- boards, board_columns, tasks';
    RAISE NOTICE 'Created conditional policies for new tables:';
    RAISE NOTICE '- team_invites, activities, notifications';
    RAISE NOTICE 'Next: Run 03_functions_triggers.sql';
END $$;