import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// Get user's teams
export async function GET(request: NextRequest) {
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

    // Get teams where user is owner or member
    const teams = await db.team.findMany({
      where: {
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, email: true, displayName: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true }
            }
          }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Teams API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    await db.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata?.display_name || null,
      },
      update: {}
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
