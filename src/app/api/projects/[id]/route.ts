import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.project.findFirst({
      where: {
        id: params.id,
      },
      include: {
        client: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        boards: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            boards: true,
            issues: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify user has access to the team
    const teamAccess = await db.teamMember.findFirst({
      where: {
        teamId: project.teamId,
        userId: user.id,
      },
    });

    const isOwner = await db.team.findFirst({
      where: {
        id: project.teamId,
        createdBy: user.id,
      },
    });

    if (!teamAccess && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.project.findFirst({
      where: {
        id: params.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify user has access to the team
    const teamAccess = await db.teamMember.findFirst({
      where: {
        teamId: project.teamId,
        userId: user.id,
      },
    });

    const isOwner = await db.team.findFirst({
      where: {
        id: project.teamId,
        createdBy: user.id,
      },
    });

    if (!teamAccess && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, clientId, startDate, endDate, status, goal } = body;

    // If clientId is provided, verify the client exists and user has access
    if (clientId) {
      const client = await db.client.findFirst({
        where: {
          id: clientId,
          createdBy: user.id,
        },
      });

      if (!client) {
        return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 });
      }
    }

    const updatedProject = await db.project.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        ...(clientId ? { client: { connect: { id: clientId } } } : {}),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status,
        ...(goal !== undefined ? { goal: Number(goal) } : {}),
      },
      include: {
        client: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        boards: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            boards: true,
            issues: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.project.findFirst({
      where: {
        id: params.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify user has access to the team
    const teamAccess = await db.teamMember.findFirst({
      where: {
        teamId: project.teamId,
        userId: user.id,
      },
    });

    const isOwner = await db.team.findFirst({
      where: {
        id: project.teamId,
        createdBy: user.id,
      },
    });

    if (!teamAccess && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.project.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
