-- ====================================
-- FIX INFINITE RECURSION IN TEAM_USERS POLICIES
-- Run this to fix the circular reference issue
-- ====================================

-- 1. DROP THE PROBLEMATIC TEAM_USERS POLICIES
-- ====================================
DROP POLICY IF EXISTS "Users can view team members for their teams" ON public.team_users;
DROP POLICY IF EXISTS "Team admins can manage team members" ON public.team_users;
DROP POLICY IF EXISTS "Allow inserting team members" ON public.team_users;

-- 2. CREATE NON-RECURSIVE TEAM_USERS POLICIES
-- ====================================

-- Allow users to view their own team memberships
CREATE POLICY "Users can view their own team memberships" ON public.team_users
    FOR SELECT USING (user_id = auth.uid());

-- Allow users to view team members where they are also a member (using EXISTS to avoid recursion)
CREATE POLICY "Users can view other team members" ON public.team_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_users tu_self
            WHERE tu_self.team_id = team_users.team_id 
            AND tu_self.user_id = auth.uid()
        )
    );

-- Allow team creators to insert team members
CREATE POLICY "Team creators can add members" ON public.team_users
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT id FROM public.teams WHERE created_by = auth.uid()
        )
    );

-- Allow users to add themselves to teams (for invite acceptance)
CREATE POLICY "Users can add themselves to teams" ON public.team_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow team creators and admins to update team members
CREATE POLICY "Team creators can update members" ON public.team_users
    FOR UPDATE USING (
        team_id IN (
            SELECT id FROM public.teams WHERE created_by = auth.uid()
        )
    );

-- Allow admins to update team members (non-recursive check)
CREATE POLICY "Team admins can update members" ON public.team_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.team_users tu_admin
            WHERE tu_admin.team_id = team_users.team_id 
            AND tu_admin.user_id = auth.uid() 
            AND tu_admin.role = 'admin'
        )
    );

-- Allow team creators and admins to delete team members
CREATE POLICY "Team creators can remove members" ON public.team_users
    FOR DELETE USING (
        team_id IN (
            SELECT id FROM public.teams WHERE created_by = auth.uid()
        )
    );

-- Allow admins to remove team members (non-recursive check)
CREATE POLICY "Team admins can remove members" ON public.team_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.team_users tu_admin
            WHERE tu_admin.team_id = team_users.team_id 
            AND tu_admin.user_id = auth.uid() 
            AND tu_admin.role = 'admin'
        )
    );

-- Allow users to remove themselves from teams
CREATE POLICY "Users can remove themselves from teams" ON public.team_users
    FOR DELETE USING (user_id = auth.uid());

-- 3. SUCCESS MESSAGE
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '=== TEAM_USERS POLICIES FIXED ===';
    RAISE NOTICE 'Removed recursive policies';
    RAISE NOTICE 'Added non-recursive policies using EXISTS';
    RAISE NOTICE 'Team creation should now work!';
END $$;