import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
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

    // Check if user exists in Prisma database
    let prismaUser = await (db as any).user.findUnique({
      where: { id: user.id }
    });

    // If user doesn't exist, create them
    if (!prismaUser) {
      console.log('Creating new user in Prisma:', user.id, user.email);
      
      // Check for orphaned user with same email
      const orphanedUser = await (db as any).user.findUnique({
        where: { email: user.email || '' },
        include: {
          _count: {
            select: {
              ownedTeams: true,
              teamMembers: true,
            }
          }
        }
      });
      
      if (orphanedUser) {
        // Only delete if no teams or memberships
        if (orphanedUser._count.ownedTeams === 0 && orphanedUser._count.teamMembers === 0) {
          console.log('🗑️ Deleting orphaned user with email:', user.email);
          await (db as any).user.delete({
            where: { id: orphanedUser.id }
          });
        } else {
          console.warn('⚠️ Orphaned user has data, skipping deletion');
          return NextResponse.json({ 
            error: 'Account conflict. Please contact support.',
            user: null 
          }, { status: 409 });
        }
      }
      
      // Get display name from user metadata or use email
      const displayName = user.user_metadata?.name || 
                         user.user_metadata?.display_name || 
                         user.email?.split('@')[0] || 
                         'User';
      
      prismaUser = await (db as any).user.create({
        data: {
          id: user.id,
          email: user.email || '',
          displayName: displayName,
        }
      });

      // Create a default team for the user
      const defaultTeam = await (db as any).team.create({
        data: {
          name: `${displayName}'s Team`,
          description: 'Your personal workspace',
          createdBy: prismaUser.id,
        }
      });

      // Create a default board in the team
      const defaultBoard = await (db as any).board.create({
        data: {
          name: 'Getting Started',
          description: 'Your first board to get started with Nesternity',
          type: 'KANBAN',
          teamId: defaultTeam.id,
          createdBy: prismaUser.id,
        }
      });

      // Create default lists in the board
      await (db as any).boardList.createMany({
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
          }
        ]
      });

      console.log('Created default team and board for user:', prismaUser.id);
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: prismaUser.id,
        email: prismaUser.email,
        displayName: prismaUser.displayName
      }
    });

  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
