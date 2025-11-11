import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/unread-count
 * Get count of recent notifications (last 7 days)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count activities from last 7 days that don't have a notification record
    // or have a notification record where readAt is null
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activities = await db.activity.findMany({
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
      },
      include: {
        notifications: {
          where: {
            userId: user.id
          },
          select: {
            readAt: true
          }
        }
      }
    });

    // Count only unread: no notification record OR notification with readAt null
    const count = activities.filter(activity => 
      activity.notifications.length === 0 || activity.notifications[0].readAt === null
    ).length;

    return NextResponse.json({ count });

  } catch (error: any) {
    console.error('[NotificationsAPI] Error counting unread:', error);
    return NextResponse.json(
      { error: 'Failed to count notifications', details: error?.message },
      { status: 500 }
    );
  }
}
