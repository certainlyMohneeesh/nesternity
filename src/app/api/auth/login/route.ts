import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`\n[Login API] ========== REQUEST START [${requestId}] ==========`);
  console.log('[Login API] Timestamp:', new Date().toISOString());
  console.log('[Login API] Origin:', request.headers.get('origin'));
  console.log('[Login API] User-Agent:', request.headers.get('user-agent')?.substring(0, 100));

  try {
    // Parse request body with timeout
    console.log('[Login API] Step 1: Parsing request body...');
    const body = await request.json();
    const { email, password } = body;

    console.log('[Login API] Request data:', {
      email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'missing',
      hasPassword: !!password,
      requestId,
    });

    // Validate input
    if (!email || !password) {
      console.error('[Login API] ❌ Missing credentials:', {
        hasEmail: !!email,
        hasPassword: !!password,
        requestId,
      });
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client (handles cookies properly)
    console.log('[Login API] Step 2: Creating Supabase client...');
    const supabase = await createClient();
    console.log('[Login API] ✅ Supabase client created');

    // Attempt to sign in with Supabase
    console.log('[Login API] Step 3: Authenticating with Supabase...');
    const authStartTime = Date.now();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    const authDuration = Date.now() - authStartTime;
    console.log('[Login API] Auth request completed in:', `${authDuration}ms`);

    if (error) {
      console.error('[Login API] ❌ Supabase auth error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        requestId,
      });
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.session || !data.user) {
      console.error('[Login API] ❌ No session created:', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        requestId,
      });
      return NextResponse.json(
        { error: 'Login failed - no session created' },
        { status: 401 }
      );
    }

    console.log('[Login API] ✅ Authentication successful:', {
      userId: data.user.id,
      email: data.user.email,
      requestId,
    });

    // Sync user to Prisma database (non-blocking, with timeout)
    console.log('[Login API] Step 4: Syncing user to database...');
    const syncStartTime = Date.now();
    
    try {
      // Set a timeout for database operations (10 seconds max)
      const syncPromise = (async () => {
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
              throw new Error('Account conflict. Please contact support.');
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

          // Phase 7: Create default OWNER organisation (Organisation-Centric Architecture)
          console.log('[Login API] Creating default OWNER organisation');
          const defaultOrganisation = await db.organisation.create({
            data: {
              name: `${displayName}'s Organisation`,
              email: data.user.email || '',
              type: 'OWNER',
              status: 'ACTIVE',
              ownerId: prismaUser.id,
            },
          });
          console.log('[Login API] ✅ Created OWNER organisation:', defaultOrganisation.id);

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

          console.log('[Login API] ✅ Created default team, organisation, and board for user');
        } else {
          console.log('[Login API] ✅ User exists in database');
        }
      })();

      // Race between sync and timeout
      await Promise.race([
        syncPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database sync timeout')), 10000)
        )
      ]);

      const syncDuration = Date.now() - syncStartTime;
      console.log('[Login API] User sync completed in:', `${syncDuration}ms`);

    } catch (syncError) {
      const syncDuration = Date.now() - syncStartTime;
      console.error('[Login API] ⚠️  User sync error (non-fatal):', {
        error: syncError instanceof Error ? syncError.message : 'Unknown error',
        duration: `${syncDuration}ms`,
        requestId,
      });
      // Don't fail the login if sync fails - user can still access Supabase auth
      // The sync will happen on next API call that requires the user
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Login API] ========== REQUEST COMPLETE [${requestId}] ==========`);
    console.log('[Login API] Total Duration:', `${totalDuration}ms`);
    console.log('[Login API] Success: true\n');

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.name || data.user.email?.split('@')[0]
      }
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('[Login API] ========== REQUEST FAILED [' + requestId + '] ==========');
    console.error('[Login API] ❌ Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      duration: `${totalDuration}ms`,
      requestId,
    });
    console.error('[Login API] Full error object:', error);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    );
  }
}
