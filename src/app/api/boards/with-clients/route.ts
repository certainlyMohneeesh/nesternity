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

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    let whereClause;
    
    if (teamId) {
      // If teamId is provided, verify access and get boards for that team
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

      whereClause = {
        teamId,
        archived: false,
      };
    } else {
      // If no teamId, get all boards from teams the user has access to
      const userTeams = await prisma.teamMember.findMany({
        where: {
          userId: user.id,
        },
        select: {
          teamId: true,
        },
      });

      const ownedTeams = await prisma.team.findMany({
        where: {
          createdBy: user.id,
        },
        select: {
          id: true,
        },
      });

      const allTeamIds = [
        ...userTeams.map(tm => tm.teamId),
        ...ownedTeams.map(t => t.id),
      ];

      whereClause = {
        teamId: {
          in: allTeamIds,
        },
        archived: false,
      };
    }

    // Get boards with project and client information
    const boards = await prisma.board.findMany({
      where: whereClause,
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
