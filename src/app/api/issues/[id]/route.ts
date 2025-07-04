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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const issue = await prisma.issue.findFirst({
      where: {
        id: resolvedParams.id,
        OR: [
          { createdBy: user.id },
          { assignedTo: user.id },
        ],
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
            createdAt: 'asc',
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    const body = await req.json();
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
    } = body;

    const issue = await prisma.issue.updateMany({
      where: {
        id: resolvedParams.id,
        OR: [
          { createdBy: user.id },
          { assignedTo: user.id },
        ],
      },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
    });

    if (issue.count === 0) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const updatedIssue = await prisma.issue.findUnique({
      where: { id: resolvedParams.id },
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

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const issue = await prisma.issue.deleteMany({
      where: {
        id: resolvedParams.id,
        createdBy: user.id, // Only creator can delete
      },
    });

    if (issue.count === 0) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
