import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSafeUser } from '@/lib/safe-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSafeUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Verify user has access to the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id
      }
    });

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        createdBy: user.id
      }
    });

    if (!teamMember && !team) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      where: {
        teamId,
      },
      include: {
        client: true,
        _count: {
          select: {
            boards: true,
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

export async function POST(req: NextRequest) {
  try {
    const user = await getSafeUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, clientId, teamId, startDate, endDate } = body;

    if (!name || !teamId) {
      return NextResponse.json({ error: 'Name and team ID are required' }, { status: 400 });
    }

    // Verify user has access to the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id
      }
    });

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        createdBy: user.id
      }
    });

    if (!teamMember && !team) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If clientId is provided, verify user owns the client
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          createdBy: user.id,
        },
      });

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        clientId,
        teamId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
