import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { checkTeamAccess } from '@/lib/team-auth';

// GET /api/teams/[teamId]/clients
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    console.log('GET clients - Starting request for team:', teamId);
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Auth error:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Check if user has access to the team
    const hasAccess = await checkTeamAccess(teamId, user.id);
    console.log('Team access check result:', hasAccess);
    if (!hasAccess) {
      console.log('Access denied for user:', user.id, 'to team:', teamId);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all clients for projects in this team
    const clients = await prisma.client.findMany({
      where: {
        projects: {
          some: {
            teamId
          }
        }
      },
      include: {
        projects: {
          where: {
            teamId
          },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Clients found:', clients.length);
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/clients
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    
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

    // Check if user has access to the team
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

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        company,
        address,
        notes,
        createdBy: user.id,
        projects: projectIds && projectIds.length > 0 ? {
          connect: projectIds.map((id: string) => ({ id }))
        } : undefined,
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
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
