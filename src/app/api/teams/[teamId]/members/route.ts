import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ teamId: string }>
}

// Get team members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this team
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id } } }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    const members = await db.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: { id: true, email: true, displayName: true, avatarUrl: true }
        }
      },
      orderBy: { acceptedAt: 'asc' }
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update member role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, role } = await request.json();

    if (!memberId || !role) {
      return NextResponse.json({ error: 'Member ID and role required' }, { status: 400 });
    }

    // Check if user is team owner or admin
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id, role: 'admin' } } }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Update member role
    const updatedMember = await db.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, email: true, displayName: true }
        }
      }
    });

    // Log activity
    await db.activity.create({
      data: {
        teamId,
        userId: user.id,
        type: 'MEMBER_ROLE_UPDATED',
        title: `Updated ${updatedMember.user.displayName || updatedMember.user.email}'s role to ${role}`,
        details: { memberId, newRole: role }
      }
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Remove team member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    // Check if user is team owner or admin
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id, role: 'admin' } } }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Get member details before deletion
    const member = await db.teamMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, email: true, displayName: true }
        }
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Don't allow removing the team owner
    if (member.userId === team.createdBy) {
      return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 });
    }

    // Remove member
    await db.teamMember.delete({
      where: { id: memberId }
    });

    // Log activity
    await db.activity.create({
      data: {
        teamId,
        userId: user.id,
        type: 'MEMBER_REMOVED',
        title: `Removed ${member.user.displayName || member.user.email} from the team`,
        details: { removedUserId: member.userId }
      }
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
