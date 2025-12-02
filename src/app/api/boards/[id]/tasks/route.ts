import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: boardId } = await context.params;
    console.log('[BoardTasksAPI] GET - Fetching tasks for board:', boardId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[BoardTasksAPI] No valid authorization header');
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[BoardTasksAPI] Unauthorized:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[BoardTasksAPI] User authenticated:', user.id);

    // First, check if board exists and user has access
    const board = await db.board.findUnique({
      where: { id: boardId },
      include: {
        team: {
          select: {
            id: true,
            createdBy: true,
            members: {
              where: {
                userId: user.id,
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      console.error('[BoardTasksAPI] Board not found:', boardId);
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Check if user has access (is team owner or member)
    const hasAccess = board.team.createdBy === user.id || board.team.members.length > 0;
    
    if (!hasAccess) {
      console.error('[BoardTasksAPI] Access denied for user:', user.id);
      return NextResponse.json({ error: 'Access denied to this board' }, { status: 403 });
    }

    console.log('[BoardTasksAPI] User has access to board');

    // Fetch all tasks for this board
    const tasks = await db.task.findMany({
      where: {
        boardId: boardId,
        archived: false, // Only get non-archived tasks by default
      },
      include: {
        list: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { assignedAt: 'asc' },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: [
        {
          list: {
            position: 'asc',
          },
        },
        {
          position: 'asc',
        },
      ],
    });

    console.log('[BoardTasksAPI] Found tasks:', tasks.length);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[BoardTasksAPI] Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
