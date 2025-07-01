import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ teamId: string; boardId: string }>
}

// Get specific board details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, boardId } = await params;
    
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

    // Verify user has access to the team
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id
      }
    });

    const team = await db.team.findFirst({
      where: {
        id: teamId,
        createdBy: user.id
      }
    });

    if (!teamMember && !team) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get board with lists and tasks
    const board = await (db as any).board.findUnique({
      where: {
        id: boardId,
        teamId // Ensure board belongs to the team
      },
      include: {
        lists: {
          where: { archived: false },
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, email: true, displayName: true, avatarUrl: true }
                },
                creator: {
                  select: { id: true, email: true, displayName: true }
                },
                _count: {
                  select: { comments: true, attachments: true }
                }
              }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json({ board });
  } catch (error) {
    console.error('Get board error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update board
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, boardId } = await params;
    
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

    const { name, description, settings } = await request.json();

    // Verify user has admin access to the team
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: 'admin'
      }
    });

    const team = await db.team.findFirst({
      where: {
        id: teamId,
        createdBy: user.id
      }
    });

    if (!teamMember && !team) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Update the board
    const updatedBoard = await (db as any).board.update({
      where: {
        id: boardId,
        teamId
      },
      data: {
        name,
        description,
        settings
      },
      include: {
        lists: {
          where: { archived: false },
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: { tasks: true }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    // Create activity log
    await (db as any).boardActivity.create({
      data: {
        boardId,
        userId: user.id,
        action: 'BOARD_UPDATED',
        details: {
          updates: { name, description, settings }
        }
      }
    });

    return NextResponse.json({ board: updatedBoard });
  } catch (error) {
    console.error('Update board error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete/Archive board
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, boardId } = await params;
    
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

    // Verify user has admin access to the team
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: 'admin'
      }
    });

    const team = await db.team.findFirst({
      where: {
        id: teamId,
        createdBy: user.id
      }
    });

    if (!teamMember && !team) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Archive the board instead of deleting
    const archivedBoard = await (db as any).board.update({
      where: {
        id: boardId,
        teamId
      },
      data: {
        archived: true
      }
    });

    // Create activity log
    await (db as any).boardActivity.create({
      data: {
        boardId,
        userId: user.id,
        action: 'BOARD_ARCHIVED',
        details: {
          boardName: archivedBoard.name
        }
      }
    });

    return NextResponse.json({ message: 'Board archived successfully' });
  } catch (error) {
    console.error('Archive board error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
