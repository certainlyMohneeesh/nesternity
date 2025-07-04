import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('projectId');
    const boardId = searchParams.get('boardId');
    const assignedTo = searchParams.get('assignedTo');

    const where: any = {
      OR: [
        { createdBy: user.id },
        { assignedTo: user.id },
      ],
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (boardId) {
      where.boardId = boardId;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        board: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      priority,
      projectId,
      boardId,
      taskId,
      assignedTo,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Verify access to related entities
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          team: {
            OR: [
              { createdBy: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        projectId,
        boardId,
        taskId,
        assignedTo,
        createdBy: user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
