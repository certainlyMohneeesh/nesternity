import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ teamId: string; boardId: string }>
}

// Get tasks for a board
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

    // Get optional filters from query params
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    const assignedTo = searchParams.get('assignedTo');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');

    // Build filter conditions
    const where: any = {
      boardId,
      archived: false, // Only show non-archived tasks by default
      ...(listId && { listId }),
      ...(assignedTo && { assignedTo }),
      ...(priority && { priority }),
      ...(status && { status })
    };

    // Get tasks with all related data
    const tasks = await (db as any).task.findMany({
      where,
      include: {
        list: {
          select: { id: true, name: true, color: true }
        },
        assignee: {
          select: { id: true, email: true, displayName: true, avatarUrl: true }
        },
        creator: {
          select: { id: true, email: true, displayName: true }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Limit to recent comments
          include: {
            user: {
              select: { id: true, email: true, displayName: true, avatarUrl: true }
            }
          }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { comments: true, attachments: true }
        }
      },
      orderBy: { position: 'asc' }
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new task
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { 
      title, 
      description, 
      listId, 
      assignedTo, 
      priority, 
      dueDate, 
      estimatedHours,
      tags 
    } = await request.json();

    if (!title || !listId) {
      return NextResponse.json({ error: 'Title and list ID are required' }, { status: 400 });
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

    // Verify the list belongs to the board
    const list = await (db as any).boardList.findFirst({
      where: {
        id: listId,
        boardId
      }
    });

    if (!list) {
      return NextResponse.json({ error: 'Invalid list ID' }, { status: 400 });
    }

    // Get the next position for the task in the list
    const lastTask = await (db as any).task.findFirst({
      where: { listId },
      orderBy: { position: 'desc' }
    });

    const position = (lastTask?.position || 0) + 1;

    // Create the task
    const task = await (db as any).task.create({
      data: {
        title,
        description,
        boardId,
        listId,
        assignedTo,
        createdBy: user.id,
        priority: priority || 'MEDIUM',
        status: 'TODO',
        position,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours,
        tags: tags || []
      },
      include: {
        list: {
          select: { id: true, name: true, color: true }
        },
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
    });

    // Create activity log
    await (db as any).taskActivity.create({
      data: {
        taskId: task.id,
        userId: user.id,
        action: 'TASK_CREATED',
        details: {
          taskTitle: title,
          listName: list.name
        }
      }
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
