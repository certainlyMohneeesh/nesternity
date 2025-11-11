import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client (handles cookies properly)
    const supabase = await createClient();

    // Attempt to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('[Login API] Supabase auth error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: 'Login failed - no session created' },
        { status: 401 }
      );
    }

    // Sync user to Prisma database
    try {
      let prismaUser = await db.user.findUnique({
        where: { id: data.user.id },
      });

      if (!prismaUser) {
        console.log('[Login API] Creating new user in database:', data.user.id);

        // Check for orphaned user with same email
        const orphanedUser = await db.user.findUnique({
          where: { email: data.user.email || '' },
          include: {
            _count: {
              select: {
                ownedTeams: true,
                teamMembers: true,
              },
            },
          },
        });

        if (orphanedUser) {
          // Only delete if no teams or memberships
          if (
            orphanedUser._count.ownedTeams === 0 &&
            orphanedUser._count.teamMembers === 0
          ) {
            console.log('[Login API] Deleting orphaned user:', data.user.email);
            await db.user.delete({
              where: { id: orphanedUser.id },
            });
          } else {
            console.warn('[Login API] Orphaned user has data, cannot delete');
            return NextResponse.json(
              { error: 'Account conflict. Please contact support.' },
              { status: 409 }
            );
          }
        }

        // Get display name from user metadata
        const displayName =
          data.user.user_metadata?.name ||
          data.user.user_metadata?.display_name ||
          data.user.email?.split('@')[0] ||
          'User';

        // Create user in database
        prismaUser = await db.user.create({
          data: {
            id: data.user.id,
            email: data.user.email || '',
            displayName: displayName,
          },
        });

        // Create default team
        const defaultTeam = await db.team.create({
          data: {
            name: `${displayName}'s Team`,
            description: 'Your personal workspace',
            createdBy: prismaUser.id,
          },
        });

        // Add user as team member
        await db.teamMember.create({
          data: {
            teamId: defaultTeam.id,
            userId: prismaUser.id,
            role: 'owner',
            addedBy: prismaUser.id,
          },
        });

        // Create default board
        const defaultBoard = await db.board.create({
          data: {
            name: 'Getting Started',
            description: 'Your first board to get started with Nesternity',
            type: 'KANBAN',
            teamId: defaultTeam.id,
            createdBy: prismaUser.id,
          },
        });

        // Create default lists
        await db.boardList.createMany({
          data: [
            {
              name: 'To Do',
              boardId: defaultBoard.id,
              position: 1,
              color: '#ef4444',
            },
            {
              name: 'In Progress',
              boardId: defaultBoard.id,
              position: 2,
              color: '#f59e0b',
            },
            {
              name: 'Done',
              boardId: defaultBoard.id,
              position: 3,
              color: '#10b981',
            },
          ],
        });

        console.log('[Login API] Created default team and board for user');
      }
    } catch (syncError) {
      console.error('[Login API] User sync error:', syncError);
      // Don't fail the login if sync fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.name || data.user.email?.split('@')[0]
      }
    });

  } catch (error) {
    console.error('[Login API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
