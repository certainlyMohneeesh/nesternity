import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ token: string }>
}

// Get invite details by token
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invite = await db.teamInvite.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            organisationId: true,
            projects: {
              select: {
                id: true,
                organisationId: true
              },
              take: 1
            }
          }
        },
        inviter: { select: { email: true, displayName: true } }
      }
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Invite already used' }, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
    }

    return NextResponse.json({ invite });
  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Accept invite
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find invite
    const invite = await db.teamInvite.findUnique({
      where: { token },
      include: { team: true }
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Invite already used' }, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
    }

    // Check if invite email matches user email
    if (invite.email !== user.email) {
      return NextResponse.json({
        error: 'This invite was sent to a different email address'
      }, { status: 400 });
    }

    // Ensure user exists in our database
    let dbUser = await db.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          id: user.id,
          email: user.email!,
          displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        }
      });
    }

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
        message: 'You are already a member of this team',
        team: invite.team
      });
    }

    // Add user to team and mark invite as used
    await db.$transaction([
      db.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId: user.id,
          role: invite.role,
          addedBy: invite.invitedBy
        }
      }),
      db.teamInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() }
      }),
      db.activity.create({
        data: {
          teamId: invite.teamId,
          userId: user.id,
          type: 'MEMBER_JOINED',
          title: `${dbUser.displayName || dbUser.email} joined the team`,
          details: { role: invite.role }
        }
      })
    ]);

    return NextResponse.json({
      message: 'Successfully joined team',
      team: invite.team
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
