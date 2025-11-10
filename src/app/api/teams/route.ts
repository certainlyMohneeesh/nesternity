import { NextRequest, NextResponse } from 'next/server';
import { db, testDatabaseConnection } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { logEnvironmentInfo } from '@/lib/env-validation';

// Get user's teams
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Teams API: Starting request...');
    logEnvironmentInfo();

    // Test database connection first
    try {
      await testDatabaseConnection();
    } catch (dbError: any) {
      console.error('❌ Database connection test failed:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: process.env.NODE_ENV === 'development' ? dbError?.message : 'Service temporarily unavailable'
      }, { status: 503 });
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('🔄 Auth header present:', !!authHeader);
    console.log('🔄 Token present:', !!token);
    
    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    // Verify user with token
    let user;
    try {
      if (token.startsWith('fake-token-') && process.env.NODE_ENV === 'development') {
        const userId = token.replace('fake-token-', '');
        user = { id: userId };
        console.log('🔄 Using development token for user:', userId);
      } else {
        console.log('🔄 Verifying token with Supabase...');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError) {
          console.error('❌ Supabase auth error:', authError);
          return NextResponse.json({ 
            error: 'Authentication failed',
            details: authError.message 
          }, { status: 401 });
        }
        
        if (!authUser) {
          console.log('❌ No user found for token');
          return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }
        
        user = authUser;
        console.log('✅ User authenticated:', user.id);
      }
    } catch (authError: any) {
      console.error('❌ Token verification failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication error',
        details: process.env.NODE_ENV === 'development' ? authError?.message : 'Authentication failed'
      }, { status: 401 });
    }

    // Get teams where user is owner or member
    console.log('🔄 Fetching teams for user:', user.id);
    
    try {
      const teams = await db.team.findMany({
        where: {
          OR: [
            { createdBy: user.id },
            { 
              members: { 
                some: { 
                  userId: user.id
                } 
              } 
            }
          ]
        },
        include: {
          owner: {
            select: { id: true, email: true, displayName: true }
          },
          members: {
            include: {
              user: {
                select: { id: true, email: true, displayName: true, avatarUrl: true }
              }
            },
            orderBy: { acceptedAt: 'asc' }
          },
          _count: {
            select: { 
              members: true,
              boards: true,
              projects: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log('✅ Teams fetched successfully:', teams.length);
      
      return NextResponse.json({ teams });
    } catch (dbQueryError: any) {
      console.error('❌ Database query failed:', dbQueryError);
      return NextResponse.json({ 
        error: 'Database query failed',
        details: process.env.NODE_ENV === 'development' ? dbQueryError?.message : 'Failed to fetch teams'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Unexpected error in teams API:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : 'Something went wrong'
    }, { status: 500 });
  }
}

// Create new team
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

    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Ensure user exists in our database
    // First, check if there's an orphaned user with this email
    const existingUserWithEmail = await db.user.findUnique({
      where: { email: user.email! },
      include: {
        _count: {
          select: {
            ownedTeams: true,
            teamMembers: true,
          }
        }
      }
    });
    
    if (existingUserWithEmail && existingUserWithEmail.id !== user.id) {
      // Only delete if user has no teams or memberships
      if (existingUserWithEmail._count.ownedTeams === 0 && existingUserWithEmail._count.teamMembers === 0) {
        console.log(`🗑️ Deleting orphaned user: ${existingUserWithEmail.email} (${existingUserWithEmail.id})`);
        await db.user.delete({
          where: { id: existingUserWithEmail.id }
        });
      } else {
        // User has data, don't delete - this shouldn't happen normally
        console.warn(`⚠️ Orphaned user ${existingUserWithEmail.email} has data, not deleting`);
        return NextResponse.json({ 
          error: 'Account conflict. Please contact support.' 
        }, { status: 409 });
      }
    }

    // Now upsert the current user
    await db.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata?.display_name || null,
      },
      update: {
        email: user.email!,
        displayName: user.user_metadata?.display_name || null,
      }
    });

    // Create team
    const team = await db.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: user.id,
      },
      include: {
        owner: {
          select: { id: true, email: true, displayName: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    // Create activity
    await db.activity.create({
      data: {
        teamId: team.id,
        userId: user.id,
        type: 'TEAM_CREATED',
        title: `Created team "${team.name}"`,
      }
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
