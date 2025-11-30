import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/organisations/[id]/projects - List organisation's projects
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params (Next.js may provide a thenable for params) and check ownership
    const { id: orgId } = (await params) as { id: string };
    const organisation = await prisma.organisation.findUnique({
      where: { id: orgId }
    });

    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // Allow both organisation owners AND team members to see projects
    const isOwner = organisation.ownerId === user.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      organisationId: orgId
    };

    // If user is not the owner, filter to only projects where they're a team member
    if (!isOwner) {
      where.team = {
        members: {
          some: {
            userId: user.id
          }
        }
      };
    }

    if (status) {
      where.status = status;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            boards: true,
            issues: true,
            proposals: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Get organisation projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/organisations/[id]/projects - Create project under organisation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check ownership and project limits
    const { id: orgId } = (await params) as { id: string };
    const organisation = await prisma.organisation.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    if (organisation.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check project limit
    if (organisation.maxProjects !== -1 && organisation._count.projects >= organisation.maxProjects) {
      return NextResponse.json(
        {
          error: 'Project limit reached',
          message: `This organisation has reached the maximum number of projects (${organisation.maxProjects}).`,
          limit: organisation.maxProjects,
          current: organisation._count.projects
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      status,
      startDate,
      endDate,
      teamId
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // If no teamId provided, create a default team for this project
    let projectTeamId = teamId;

    if (!projectTeamId) {
      const defaultTeam = await prisma.team.create({
        data: {
          name: `${name} Team`,
          description: `Default team for ${name}`,
          createdBy: user.id,
          organisationId: orgId  // ADD: Associate team with organisation
        }
      });

      // Add creator as team member
      await prisma.teamMember.create({
        data: {
          teamId: defaultTeam.id,
          userId: user.id,
          role: 'owner',
          addedBy: user.id
        }
      });

      projectTeamId = defaultTeam.id;
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'PLANNING',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        organisationId: orgId,
        teamId: projectTeamId
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        },
        organisation: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json({
      project,
      message: 'Project created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
