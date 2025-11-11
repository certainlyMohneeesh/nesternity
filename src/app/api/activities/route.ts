import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// Get activities (team-specific or user-specific)
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let activities;

    if (teamId) {
      // Get activities for a specific team
      // First check if user has access to this team
      const team = await db.team.findFirst({
        where: {
          id: teamId,
          OR: [
            { createdBy: user.id },
            { members: { some: { userId: user.id } } }
          ]
        }
      });

      if (!team) {
        return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
      }

      activities = await db.activity.findMany({
        where: { teamId },
        include: {
          user: {
            select: { id: true, email: true, displayName: true, avatarUrl: true }
          },
          team: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } else {
      // Get activities for all teams the user has access to
      const userTeams = await db.team.findMany({
        where: {
          OR: [
            { createdBy: user.id },
            { members: { some: { userId: user.id } } }
          ]
        },
        select: { id: true }
      });

      const teamIds = userTeams.map((team: { id: string }) => team.id);

      activities = await db.activity.findMany({
        where: { teamId: { in: teamIds } },
        include: {
          user: {
            select: { id: true, email: true, displayName: true, avatarUrl: true }
          },
          team: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    }

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create custom activity (for manual logging)
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      teamId, 
      type, 
      actionType, // Support both 'type' and 'actionType' 
      title, 
      description,
      details,
      metadata,
      boardId,
      taskId
    } = body;

    const activityType = actionType || type;

    if (!teamId || !activityType || !title) {
      return NextResponse.json({ error: 'Team ID, type, and title required' }, { status: 400 });
    }

    // Check if user has access to this team
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id } } }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Build details object
    const activityDetails: any = { ...(details || {}), ...(metadata || {}) };
    if (description) {
      activityDetails.description = description;
    }
    if (boardId) {
      activityDetails.boardId = boardId;
    }
    if (taskId) {
      activityDetails.taskId = taskId;
    }

    const activity = await db.activity.create({
      data: {
        teamId,
        userId: user.id,
        type: activityType,
        title,
        details: Object.keys(activityDetails).length > 0 ? activityDetails : null
      },
      include: {
        user: {
          select: { id: true, email: true, displayName: true, avatarUrl: true }
        },
        team: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ 
      activity,
      activityId: activity.id,
      success: true 
    });
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
