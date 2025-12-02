import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { checkTeamAccess } from '@/lib/team-auth';
import { createTaskAssignmentNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ teamId: string; boardId: string; taskId: string }>
}

// Update a task (including moving between lists)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, boardId, taskId } = await params;
    
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

    // Verify task exists and belongs to board
    const existingTask = await (db as any).task.findFirst({
      where: {
        id: taskId,
        boardId
      },
      include: {
        list: {
          select: { id: true, name: true }
        },
        assignees: {
          select: { userId: true }
        }
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData = await request.json();
    const { 
      title, 
      description, 
      listId, 
      position, 
      assignedToIds, // Changed: now accepts array of user IDs
      priority, 
      status, 
      dueDate, 
      estimatedHours,
      tags,
      archived
    } = updateData;

    // If moving to a different list, verify the new list exists
    if (listId && listId !== existingTask.listId) {
      const newList = await (db as any).boardList.findFirst({
        where: {
          id: listId,
          boardId
        }
      });

      if (!newList) {
        return NextResponse.json({ error: 'Invalid list ID' }, { status: 400 });
      }
    }

    // Build update data, only including provided fields
    const taskUpdateData: any = {};
    if (title !== undefined) taskUpdateData.title = title;
    if (description !== undefined) taskUpdateData.description = description;
    if (listId !== undefined) taskUpdateData.listId = listId;
    if (position !== undefined) taskUpdateData.position = position;
    if (priority !== undefined) taskUpdateData.priority = priority;
    if (status !== undefined) taskUpdateData.status = status;
    if (dueDate !== undefined) taskUpdateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedHours !== undefined) taskUpdateData.estimatedHours = estimatedHours;
    if (tags !== undefined) taskUpdateData.tags = tags;
    if (archived !== undefined) taskUpdateData.archived = archived;

    // Handle assignee updates
    const existingAssigneeIds = existingTask.assignees.map((a: { userId: string }) => a.userId);
    const newAssigneeIds = assignedToIds || [];
    
    // Determine added and removed assignees
    const addedAssignees = newAssigneeIds.filter((id: string) => !existingAssigneeIds.includes(id));
    const removedAssignees = existingAssigneeIds.filter((id: string) => !newAssigneeIds.includes(id));

    // Update assignees if provided
    if (assignedToIds !== undefined) {
      // Delete removed assignees
      if (removedAssignees.length > 0) {
        await (db as any).taskAssignee.deleteMany({
          where: {
            taskId,
            userId: { in: removedAssignees }
          }
        });
      }

      // Add new assignees
      if (addedAssignees.length > 0) {
        await (db as any).taskAssignee.createMany({
          data: addedAssignees.map((userId: string) => ({
            taskId,
            userId
          })),
          skipDuplicates: true
        });
      }
    }

    // Update the task
    const updatedTask = await (db as any).task.update({
      where: { id: taskId },
      data: taskUpdateData,
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

    // Create activity logs for significant changes
    if (listId && listId !== existingTask.listId) {
      const newList = await (db as any).boardList.findFirst({
        where: { id: listId }
      });
      
      await (db as any).taskActivity.create({
        data: {
          taskId,
          userId: user.id,
          action: 'TASK_MOVED',
          details: {
            fromList: existingTask.list.name,
            toList: newList.name
          }
        }
      });
    }

    // Log assignee changes and send notifications
    if (assignedToIds !== undefined && (addedAssignees.length > 0 || removedAssignees.length > 0)) {
      await (db as any).taskActivity.create({
        data: {
          taskId,
          userId: user.id,
          action: addedAssignees.length > 0 ? 'TASK_ASSIGNED' : 'TASK_UNASSIGNED',
          details: {
            addedAssignees,
            removedAssignees
          }
        }
      });

      // Send notifications to newly assigned users (except the updater)
      if (addedAssignees.length > 0) {
        try {
          // Get board and team info for the notification
          const boardInfo = await (db as any).board.findUnique({
            where: { id: boardId },
            include: {
              team: {
                include: {
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

          const organisationId = boardInfo?.team?.organisation?.id || 
                                  boardInfo?.team?.projects?.[0]?.organisationId;
          const projectId = boardInfo?.projectId || boardInfo?.team?.projects?.[0]?.id;

          for (const assigneeId of addedAssignees) {
            if (assigneeId !== user.id) {
              await createTaskAssignmentNotification(
                assigneeId,
                user.id,
                taskId,
                updatedTask.title,
                updatedTask.description || '',
                boardId,
                boardInfo?.name || 'Board',
                teamId,
                updatedTask.priority,
                updatedTask.dueDate,
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
    }

    if (status !== undefined && status !== existingTask.status) {
      await (db as any).taskActivity.create({
        data: {
          taskId,
          userId: user.id,
          action: status === 'DONE' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
          details: {
            fromStatus: existingTask.status,
            toStatus: status
          }
        }
      });
    }

    if (archived !== undefined && archived === true) {
      await (db as any).taskActivity.create({
        data: {
          taskId,
          userId: user.id,
          action: 'TASK_ARCHIVED',
          details: {
            taskTitle: existingTask.title
          }
        }
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, boardId, taskId } = await params;
    
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

    // Verify task exists and belongs to board
    const task = await (db as any).task.findFirst({
      where: {
        id: taskId,
        boardId
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Soft delete the task
    await (db as any).task.update({
      where: { id: taskId },
      data: { archived: true }
    });

    // Create activity log
    await (db as any).taskActivity.create({
      data: {
        taskId,
        userId: user.id,
        action: 'TASK_DELETED',
        details: {
          taskTitle: task.title
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
