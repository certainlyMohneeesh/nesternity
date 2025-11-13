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
    const { id: projectId } = await context.params;
    console.log('[ProjectBoardsAPI] GET - Fetching boards for project:', projectId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[ProjectBoardsAPI] No valid authorization header');
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[ProjectBoardsAPI] Unauthorized:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[ProjectBoardsAPI] User authenticated:', user.id);

    // First, check if project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
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

    if (!project) {
      console.error('[ProjectBoardsAPI] Project not found:', projectId);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access (is team owner or member)
    const hasAccess = project.team.createdBy === user.id || project.team.members.length > 0;
    
    if (!hasAccess) {
      console.error('[ProjectBoardsAPI] Access denied for user:', user.id);
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    console.log('[ProjectBoardsAPI] User has access to project');

    // Fetch boards for this project
    const boards = await db.board.findMany({
      where: {
        teamId: project.teamId,
        // Optionally filter by project if your schema has a projectId field on boards
        // If not, boards are team-wide, not project-specific
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        lists: {
          select: {
            id: true,
            name: true,
            position: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        _count: {
          select: {
            lists: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[ProjectBoardsAPI] Found boards:', boards.length);
    return NextResponse.json(boards);
  } catch (error) {
    console.error('[ProjectBoardsAPI] Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
