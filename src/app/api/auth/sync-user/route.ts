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

    // Parse request body for additional OAuth metadata
    let requestBody: any = {};
    try {
      requestBody = await request.json();
    } catch {
      // No body is fine for non-OAuth logins
    }

    console.log('🔄 Sync User: Processing user', {
      userId: user.id,
      email: user.email,
      provider: user.app_metadata?.provider,
      hasOAuthMetadata: !!requestBody.fullName || !!requestBody.avatarUrl
    });

    // Check if user exists in Prisma database
    let prismaUser = await (db as any).user.findUnique({
      where: { id: user.id }
    });

    // If user doesn't exist, create them
    if (!prismaUser) {
      console.log('🔄 Sync User: Creating new user in database');
      
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
          console.log('🗑️ Sync User: Deleting orphaned user with email:', user.email);
          await (db as any).user.delete({
            where: { id: orphanedUser.id }
          });
        } else {
          console.warn('⚠️ Sync User: Orphaned user has data, skipping deletion');
          return NextResponse.json({ 
            error: 'Account conflict. Please contact support.',
            user: null 
          }, { status: 409 });
        }
      }
      
      // Get display name from various sources (OAuth metadata or user metadata)
      const displayName = requestBody.fullName || 
                         user.user_metadata?.full_name ||
                         user.user_metadata?.name || 
                         user.user_metadata?.display_name || 
                         user.email?.split('@')[0] || 
                         'User';

      const avatarUrl = requestBody.avatarUrl || 
                       user.user_metadata?.avatar_url || 
                       null;
      
      console.log('👤 Sync User: Creating user with', {
        displayName,
        hasAvatar: !!avatarUrl,
        provider: user.app_metadata?.provider || 'email'
      });

      prismaUser = await (db as any).user.create({
        data: {
          id: user.id,
          email: user.email || '',
          displayName: displayName,
          // You can add avatarUrl field to your Prisma schema if needed
          // avatarUrl: avatarUrl,
        }
      });

      // Phase 7: Create default OWNER organisation (Organisation-Centric Architecture)
      console.log('🏢 Sync User: Creating default OWNER organisation');
      const defaultOrganisation = await db.organisation.create({
        data: {
          name: `${displayName}'s Organisation`,
          email: user.email || '',
          type: 'OWNER',
          status: 'ACTIVE',
          ownerId: prismaUser.id,
        }
      });
      console.log('✅ Sync User: Created OWNER organisation:', defaultOrganisation.id);

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

      console.log('✅ Sync User: Created default team, organisation, and board for user:', prismaUser.id);
    } else {
      console.log('✅ Sync User: User already exists in database:', prismaUser.id);
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
    console.error('❌ Sync User: Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
