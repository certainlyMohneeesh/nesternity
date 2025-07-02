import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

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

    // Verify task exists and belongs to board
    const existingTask = await (db as any).task.findFirst({
      where: {
        id: taskId,
        boardId
      },
      include: {
        list: {
          select: { id: true, name: true }
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
      assignedTo, 
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
    if (assignedTo !== undefined) taskUpdateData.assignedTo = assignedTo;
    if (priority !== undefined) taskUpdateData.priority = priority;
    if (status !== undefined) taskUpdateData.status = status;
    if (dueDate !== undefined) taskUpdateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedHours !== undefined) taskUpdateData.estimatedHours = estimatedHours;
    if (tags !== undefined) taskUpdateData.tags = tags;
    if (archived !== undefined) taskUpdateData.archived = archived;

    // Update the task
    const updatedTask = await (db as any).task.update({
      where: { id: taskId },
      data: taskUpdateData,
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

    if (assignedTo !== undefined && assignedTo !== existingTask.assignedTo) {
      await (db as any).taskActivity.create({
        data: {
          taskId,
          userId: user.id,
          action: assignedTo ? 'TASK_ASSIGNED' : 'TASK_UNASSIGNED',
          details: {
            assignedTo
          }
        }
      });
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
