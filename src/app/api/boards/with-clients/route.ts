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

    // Get boards with project and client information
    const boards = await prisma.board.findMany({
      where: {
        teamId,
        archived: false,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        lists: {
          include: {
            _count: {
              select: {
                tasks: true,
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Error fetching boards with clients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
