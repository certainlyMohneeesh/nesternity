import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ teamId: string }>
}

// Get specific team details
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

    // Get team with members and check access
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, email: true, displayName: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true, avatarUrl: true }
            }
          },
          orderBy: { acceptedAt: 'asc' }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update team details
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is owner or admin
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { 
            members: { 
              some: { 
                userId: user.id,
                role: 'admin'
              } 
            } 
          }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    const updatedTeam = await db.team.update({
      where: { id: teamId },
      data: {
        name: name || team.name,
        description: description !== undefined ? description : team.description,
      },
      include: {
        owner: {
          select: { id: true, email: true, displayName: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true, avatarUrl: true }
            }
          }
        },
        _count: {
          select: { 
            members: true,
            boards: true,
            projects: true
          }
        }
      }
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is the owner
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        createdBy: user.id
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or you are not the owner' }, { status: 404 });
    }

    // Delete the team (cascade will handle related records)
    await db.team.delete({
      where: { id: teamId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
