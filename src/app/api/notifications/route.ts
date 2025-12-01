/**
 * GET /api/notifications
 * Fetch notifications for the current user
 * 
 * Query params:
 * - limit: number (default: 50)
 * - unreadOnly: boolean (default: false)
 * - type: string (filter by activity type)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const typeFilter = searchParams.get('type');

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (unreadOnly) {
      where.readAt = null;
    }

    // Fetch notifications with related activity
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        activity: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Filter by type if specified (applied after fetching due to relation)
    let filteredNotifications = notifications;
    if (typeFilter) {
      filteredNotifications = notifications.filter(
        n => n.activity.type === typeFilter
      );
    }

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        readAt: null,
      },
    });

    // Transform to expected format
    const transformedNotifications = filteredNotifications.map(n => {
      const details = n.activity.details as Record<string, any> || {};
      return {
        id: n.id,
        user_id: n.userId,
        activity_id: n.activityId,
        read_at: n.readAt?.toISOString() || null,
        created_at: n.createdAt.toISOString(),
        activities: {
          id: n.activity.id,
          user_id: n.activity.userId,
          team_id: n.activity.teamId,
          action_type: n.activity.type,
          title: n.activity.title,
          description: details.description || null,
          action_url: details.actionUrl || null,
          action_label: details.actionLabel || null,
          metadata: details,
          created_at: n.activity.createdAt.toISOString(),
          users: n.activity.user ? {
            id: n.activity.user.id,
            display_name: n.activity.user.displayName,
            email: n.activity.user.email,
            avatar_url: n.activity.user.avatarUrl,
          } : null,
        },
      };
    });

    return NextResponse.json({
      notifications: transformedNotifications,
      count: transformedNotifications.length,
      unreadCount,
    });

  } catch (error) {
    console.error('[NotificationsAPI] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
