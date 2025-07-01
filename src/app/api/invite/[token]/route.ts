import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ token: string }>
}

// Accept team invite
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    
    // Get auth token from request headers  
    const authHeader = request.headers.get('authorization');
    const authToken = authHeader?.replace('Bearer ', '');
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the invite
    const invite = await db.teamInvite.findUnique({
      where: { token },
      include: {
        team: {
          select: { id: true, name: true }
        }
      }
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }

    // Check if invite is still valid
    if (invite.usedAt) {
      return NextResponse.json({ error: 'Invite has already been used' }, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    // Check if user email matches invite email
    if (user.email !== invite.email) {
      return NextResponse.json({ 
        error: 'This invite was sent to a different email address' 
      }, { status: 400 });
    }

    // Ensure user exists in our database
    await db.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
      update: {}
    });

    // Check if user is already a member
    const existingMember = await db.teamMember.findFirst({
      where: {
        teamId: invite.teamId,
        userId: user.id
      }
    });

    if (existingMember) {
      // Mark invite as used
      await db.teamInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() }
      });

      return NextResponse.json({ 
        error: 'You are already a member of this team',
        team: invite.team 
      }, { status: 400 });
    }

    // Add user to team
    await db.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId: user.id,
        role: invite.role,
        addedBy: invite.invitedBy,
        acceptedAt: new Date()
      }
    });

    // Mark invite as used
    await db.teamInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() }
    });

    // Create activity
    await db.activity.create({
      data: {
        teamId: invite.teamId,
        userId: user.id,
        type: 'MEMBER_JOINED',
        title: `${user.email} joined the team`,
      }
    });

    return NextResponse.json({ 
      success: true,
      teamId: invite.teamId,
      team: invite.team,
      message: `Successfully joined ${invite.team.name}!`
    });

  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
