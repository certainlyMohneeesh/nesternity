import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { checkTeamAccess, checkTeamAdminAccess } from '@/lib/team-auth';

interface RouteParams {
  params: Promise<{ teamId: string }>
}

// Get boards for a specific team
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

    // Verify user has access to the team
    const hasAccess = await checkTeamAccess(teamId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get boards for the team
    const boards = await (db as any).board.findMany({
      where: {
        teamId,
        archived: false
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
        },
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
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { name, description, type, projectId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    // Verify user has admin access to the team
    const hasAdminAccess = await checkTeamAdminAccess(teamId, user.id);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // If projectId is provided, verify it exists and user has access
    if (projectId) {
      const project = await db.project.findFirst({
        where: {
          id: projectId,
          teamId, // Ensure project belongs to this team
        },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
      }
    }

    // Get the next position for the board
    const lastBoard = await (db as any).board.findFirst({
      where: { teamId },
      orderBy: { position: 'desc' }
    });

    const position = (lastBoard?.position || 0) + 1;

    // Create the board
    const board = await (db as any).board.create({
      data: {
        name,
        description,
        type: type || 'KANBAN',
        teamId,
        createdBy: user.id,
        position,
        projectId: projectId || null,
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

    await (db as any).boardList.createMany({
      data: defaultLists.map(list => ({
        name: list.name,
        position: list.position,
        boardId: board.id
      }))
    });

    // Create activity log
    await (db as any).boardActivity.create({
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
    const createdBoard = await (db as any).board.findUnique({
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
