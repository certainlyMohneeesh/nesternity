import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSafeUser } from '@/lib/safe-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSafeUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    // Get the board first to verify access
    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
      },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: user.id,
              },
            },
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Check if user has access to the team
    const hasAccess = board.team.createdBy === user.id || board.team.members.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If projectId is provided, verify it belongs to the same team
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          teamId: board.teamId,
        },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found or not in the same team' }, { status: 404 });
      }
    }

    // Update the board
    const updatedBoard = await prisma.board.update({
      where: {
        id: params.id,
      },
      data: {
        projectId: projectId || null,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
