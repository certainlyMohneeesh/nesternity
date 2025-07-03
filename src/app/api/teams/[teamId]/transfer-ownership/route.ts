import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// POST /api/teams/[teamId]/transfer-ownership
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

    // Check if current user is the owner
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        createdBy: user.id
      },
      include: {
        members: {
          where: {
            role: 'admin'
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or you are not the owner' }, { status: 404 });
    }

    const body = await request.json();
    const { newOwnerId } = body;

    if (!newOwnerId) {
      return NextResponse.json({ error: 'New owner ID is required' }, { status: 400 });
    }

    // Check if new owner is an admin member
    const newOwnerMember = team.members.find(m => m.userId === newOwnerId);
    if (!newOwnerMember) {
      return NextResponse.json({ error: 'New owner must be an admin member' }, { status: 400 });
    }

    // Transfer ownership in a transaction
    await prisma.$transaction(async (tx) => {
      // Update team owner
      await tx.team.update({
        where: { id: teamId },
        data: { createdBy: newOwnerId }
      });

      // Ensure new owner has admin role
      await tx.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId,
            userId: newOwnerId
          }
        },
        update: {
          role: 'admin'
        },
        create: {
          teamId,
          userId: newOwnerId,
          role: 'admin',
          addedBy: user.id
        }
      });

      // Make current owner an admin member
      await tx.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId,
            userId: user.id
          }
        },
        update: {
          role: 'admin'
        },
        create: {
          teamId,
          userId: user.id,
          role: 'admin',
          addedBy: newOwnerId
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error transferring ownership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
