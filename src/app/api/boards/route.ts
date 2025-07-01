import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// Get boards for a team
export async function GET(request: NextRequest) {
  try {
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

    // Get teamId from query params
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
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

    // Get boards with lists and task counts
    const boards = await db.board.findMany({
      where: {
        teamId,
        archived: false
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
      },
      orderBy: { position: 'asc' }
    });

    return NextResponse.json({ boards });
  } catch (error) {
    console.error('Get boards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new board
export async function POST(request: NextRequest) {
  try {
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

    const { name, description, type, teamId } = await request.json();

    if (!name || !teamId) {
      return NextResponse.json({ error: 'Name and team ID are required' }, { status: 400 });
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

    // Get the next position for the board
    const lastBoard = await db.board.findFirst({
      where: { teamId },
      orderBy: { position: 'desc' }
    });

    const position = (lastBoard?.position || 0) + 1;

    // Create the board
    const board = await db.board.create({
      data: {
        name,
        description,
        type: type || 'KANBAN',
        teamId,
        createdBy: user.id,
        position
      },
      include: {
        lists: {
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

    // Create default lists based on board type
    const defaultLists = type === 'SCRUM' 
      ? [
          { name: 'Backlog', position: 0 },
          { name: 'Sprint Backlog', position: 1 },
          { name: 'In Progress', position: 2 },
          { name: 'Testing', position: 3 },
          { name: 'Done', position: 4 }
        ]
      : [
          { name: 'To Do', position: 0 },
          { name: 'In Progress', position: 1 },
          { name: 'Done', position: 2 }
        ];

    await db.boardList.createMany({
      data: defaultLists.map(list => ({
        name: list.name,
        position: list.position,
        boardId: board.id
      }))
    });

    // Create activity log
    await db.boardActivity.create({
      data: {
        boardId: board.id,
        userId: user.id,
        action: 'BOARD_CREATED',
        details: {
          boardName: name,
          boardType: type || 'KANBAN'
        }
      }
    });

    // Fetch the board with the new lists
    const createdBoard = await db.board.findUnique({
      where: { id: board.id },
      include: {
        lists: {
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

    return NextResponse.json({ board: createdBoard });
  } catch (error) {
    console.error('Create board error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
