import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { checkTeamAccess } from '@/lib/team-auth';

interface RouteParams {
  params: Promise<{ teamId: string; projectId: string }>
}

// PUT /api/teams/[teamId]/projects/[projectId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, projectId } = await params;
    
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, clientId, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Verify project belongs to this team
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        teamId
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // If clientId provided, verify it exists and is accessible
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          OR: [
            { createdBy: user.id },
            { projects: { some: { teamId } } }
          ]
        }
      });

      if (!client) {
        return NextResponse.json({ error: 'Client not found or not accessible' }, { status: 404 });
      }
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description,
        clientId: clientId || null,
        status: status || 'PLANNING',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true
          }
        },
        _count: {
          select: {
            boards: true,
            issues: true
          }
        }
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teams/[teamId]/projects/[projectId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, projectId } = await params;
    
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify project belongs to this team
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        teamId
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete the project (this will cascade to related boards and tasks)
    await prisma.project.delete({
      where: { id: projectId }
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
