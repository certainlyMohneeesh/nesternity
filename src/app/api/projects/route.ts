import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
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

    // Get all teams where the user is a member or owner
    const userTeams = await db.teamMember.findMany({
      where: {
        userId: user.id,
      },
      select: {
        teamId: true,
      },
    });

    const teamIds = userTeams.map(member => member.teamId);

    // Also include teams owned by the user
    const ownedTeams = await db.team.findMany({
      where: {
        createdBy: user.id,
      },
      select: {
        id: true,
      },
    });

    const allTeamIds = [...teamIds, ...ownedTeams.map(team => team.id)];

    // Get projects from all accessible teams
    const projects = await db.project.findMany({
      where: {
        teamId: {
          in: allTeamIds,
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, clientId, teamId, startDate, endDate, status } = body;

    if (!name || !teamId) {
      return NextResponse.json({ error: 'Name and team are required' }, { status: 400 });
    }

    // Verify user has access to the team
    const teamAccess = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
    });

    const isOwner = await db.team.findFirst({
      where: {
        id: teamId,
        createdBy: user.id,
      },
    });

    if (!teamAccess && !isOwner) {
      return NextResponse.json({ error: 'Access denied to this team' }, { status: 403 });
    }

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

    const project = await db.project.create({
      data: {
        name,
        description,
        clientId: clientId || null,
        teamId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'PLANNING',
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

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
