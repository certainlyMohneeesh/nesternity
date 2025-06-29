-- ====================================
-- TEAM INVITES SYSTEM
-- This is included in 01_create_tables.sql
-- Run this only if you need to add invites to existing database
-- ====================================

-- Create table for pending team invites
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

-- Create RLS policies for team_invites
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invites for teams they are members of
DROP POLICY IF EXISTS "Users can view team invites for their teams" ON public.team_invites;
CREATE POLICY "Users can view team invites for their teams" ON public.team_invites
FOR SELECT USING (
    team_id IN (
        SELECT team_id FROM public.team_users 
        WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
);

-- Policy: Only admins can create invites
DROP POLICY IF EXISTS "Admins can create team invites" ON public.team_invites;
CREATE POLICY "Admins can create team invites" ON public.team_invites
FOR INSERT WITH CHECK (
    team_id IN (
        SELECT team_id FROM public.team_users 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR team_id IN (
        SELECT id FROM public.teams WHERE created_by = auth.uid()
    )
);

-- Policy: Only admins can delete invites
DROP POLICY IF EXISTS "Admins can delete team invites" ON public.team_invites;
CREATE POLICY "Admins can delete team invites" ON public.team_invites
FOR DELETE USING (
    team_id IN (
        SELECT team_id FROM public.team_users 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR team_id IN (
        SELECT id FROM public.teams WHERE created_by = auth.uid()
    )
);

-- Policy: Allow updating invites when accepting
DROP POLICY IF EXISTS "Allow accepting invites" ON public.team_invites;
CREATE POLICY "Allow accepting invites" ON public.team_invites
FOR UPDATE USING (
    expires_at > NOW() 
    AND used_at IS NULL
);

-- Create function to accept invite
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
