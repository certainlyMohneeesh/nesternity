import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dodo/subscription
 * 
 * Get the current user's active subscription from Dodo Payments
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find active subscription for user
    const subscription = await prisma.dodoSubscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ['ACTIVE', 'PAST_DUE'] }
      },
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        dodoSubscriptionId: subscription.dodoSubscriptionId,
        status: subscription.status,
        planTier: subscription.planTier,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        customer: {
          email: subscription.customer.email,
          name: subscription.customer.name,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
