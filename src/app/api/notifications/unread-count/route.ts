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

    // Count activities from last 7 days as "unread"
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

    return NextResponse.json({ count });

  } catch (error: any) {
    console.error('[NotificationsAPI] Error counting unread:', error);
    return NextResponse.json(
      { error: 'Failed to count notifications', details: error?.message },
      { status: 500 }
    );
  }
}
