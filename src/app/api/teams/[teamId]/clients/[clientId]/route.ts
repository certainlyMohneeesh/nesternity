import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { checkTeamAccess } from '@/lib/team-auth';

// PUT /api/teams/[teamId]/clients/[clientId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; clientId: string }> }
) {
  try {
    const { teamId, clientId } = await params;
    
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
    const { name, email, phone, company, address, notes, projectIds } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Validate projectIds belong to this team
    if (projectIds && projectIds.length > 0) {
      const validProjects = await prisma.project.findMany({
        where: {
          id: { in: projectIds },
          teamId
        }
      });

      if (validProjects.length !== projectIds.length) {
        return NextResponse.json({ error: 'Invalid project IDs' }, { status: 400 });
      }
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        email,
        phone,
        company,
        address,
        notes,
        projects: projectIds ? {
          set: projectIds.map((id: string) => ({ id }))
        } : {
          set: []
        },
      },
      include: {
        projects: {
          include: {
            boards: {
              include: {
                _count: {
                  select: {
                    tasks: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teams/[teamId]/clients/[clientId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; clientId: string }> }
) {
  try {
    const { teamId, clientId } = await params;
    
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

    await prisma.client.delete({
      where: { id: clientId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
