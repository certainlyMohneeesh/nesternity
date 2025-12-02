import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { checkTeamAccess } from '@/lib/team-auth';
import { createTaskAssignmentNotification } from '@/lib/notifications';

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

    // Check team access
    const hasAccess = await checkTeamAccess(teamId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get optional filters from query params
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    const assignedTo = searchParams.get('assignedTo');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const archived = searchParams.get('archived');

    // Build filter conditions
    const where: any = {
      boardId,
      ...(listId && { listId }),
      ...(priority && { priority }),
      ...(status && { status })
    };

    // Filter by assignee using the junction table
    if (assignedTo) {
      where.assignees = {
        some: {
          userId: assignedTo
        }
      };
    }

    // Handle archived filter - default to false if not specified
    if (archived === 'true') {
      where.archived = true;
    } else if (archived === 'false') {
      where.archived = false;
    } else {
      // Default behavior - only show non-archived tasks
      where.archived = false;
    }

    // Get tasks with all related data
    const tasks = await (db as any).task.findMany({
      where,
      include: {
        list: {
          select: { id: true, name: true, color: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true, avatarUrl: true }
            }
          },
          orderBy: { assignedAt: 'asc' }
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
      orderBy: archived === 'true' ? { updatedAt: 'desc' } : { position: 'asc' }
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
      assignedToIds, // Changed: now accepts array of user IDs
      priority, 
      dueDate, 
      estimatedHours,
      tags 
    } = await request.json();

    if (!title || !listId) {
      return NextResponse.json({ error: 'Title and list ID are required' }, { status: 400 });
    }

    // Check team access
    const hasAccess = await checkTeamAccess(teamId, user.id);
    if (!hasAccess) {
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

    // Create the task with assignees
    const task = await (db as any).task.create({
      data: {
        title,
        description,
        boardId,
        listId,
        createdBy: user.id,
        priority: priority || 'MEDIUM',
        status: 'TODO',
        position,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours,
        tags: tags || [],
        // Create assignee records if assignedToIds provided
        ...(assignedToIds && assignedToIds.length > 0 && {
          assignees: {
            create: assignedToIds.map((userId: string) => ({
              userId
            }))
          }
        })
      },
      include: {
        list: {
          select: { id: true, name: true, color: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true, avatarUrl: true }
            }
          },
          orderBy: { assignedAt: 'asc' }
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

    // Send notifications to all assigned users (except the creator)
    if (assignedToIds && assignedToIds.length > 0) {
      try {
        // Get board info for the notification
        const boardInfo = await (db as any).board.findUnique({
          where: { id: boardId },
          select: {
            name: true,
            organisationId: true,
            projectId: true,
            team: {
              select: {
                organisation: { select: { id: true } },
                projects: { 
                  take: 1, 
                  orderBy: { createdAt: 'desc' },
                  select: { id: true, organisationId: true }
                }
              }
            }
          }
        });

        const organisationId = boardInfo?.organisationId || 
                                boardInfo?.team?.organisation?.id || 
                                boardInfo?.team?.projects?.[0]?.organisationId;
        const projectId = boardInfo?.projectId || boardInfo?.team?.projects?.[0]?.id;

        // Send notification to each assignee (except creator)
        for (const assigneeId of assignedToIds) {
          if (assigneeId !== user.id) {
            await createTaskAssignmentNotification(
              assigneeId,
              user.id,
              task.id,
              title,
              description || '',
              boardId,
              boardInfo?.name || 'Board',
              teamId,
              priority,
              dueDate ? new Date(dueDate) : undefined,
              organisationId,
              projectId
            );
            console.log(`[TaskAPI] Assignment notification sent to user: ${assigneeId}`);
          }
        }
      } catch (notifError) {
        console.error('[TaskAPI] Failed to send assignment notification:', notifError);
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
