import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * Fetch user's recent activities from their teams
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[NotificationsAPI] GET - Fetching notifications');

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[NotificationsAPI] Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[NotificationsAPI] Authenticated user:', user.id);

    // Get limit from query params (default: 50)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Fetch recent activities from teams where user is a member or owner
    const activities = await db.activity.findMany({
      where: {
        team: {
          OR: [
            { createdBy: user.id }, // Teams created by user
            { members: { some: { userId: user.id } } } // Teams where user is a member
          ]
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    console.log('[NotificationsAPI] Found activities:', activities.length);

    // Transform to notification-like format
    const notifications = activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      activityId: activity.id,
      readAt: null, // We don't have read tracking yet - can be added later
      createdAt: activity.createdAt.toISOString(),
      activities: {
        id: activity.id,
        userId: activity.userId,
        teamId: activity.teamId,
        actionType: activity.type,
        title: activity.title,
        description: typeof activity.details === 'object' && activity.details !== null
          ? (activity.details as any).description || null
          : null,
        metadata: activity.details || {},
        createdAt: activity.createdAt.toISOString(),
        users: {
          displayName: activity.user.displayName,
          email: activity.user.email
        },
        team: {
          id: activity.team.id,
          name: activity.team.name
        }
      }
    }));

    return NextResponse.json({ 
      success: true,
      notifications,
      count: notifications.length
    });

  } catch (error: any) {
    console.error('[NotificationsAPI] Error:', {
      message: error?.message,
      stack: error?.stack,
      error
    });
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications (activities created in last 7 days)
 */
export async function HEAD(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse(null, { status: 401 });
    }

    // Count activities from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const count = await db.activity.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        },
        team: {
          OR: [
            { createdBy: user.id },
            { members: { some: { userId: user.id } } }
          ]
        }
      }
    });

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Unread-Count': count.toString()
      }
    });

  } catch (error) {
    console.error('[NotificationsAPI] Error counting unread:', error);
    return new NextResponse(null, { status: 500 });
  }
}
