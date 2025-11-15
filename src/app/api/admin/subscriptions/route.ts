import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/middleware/admin-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Ensure the generated Prisma client has the Razorpay models (if not, a regenerate is required)
    if (!('razorpaySubscription' in prisma)) {
      console.error('Prisma client does not include razorpaySubscription model. Please run `pnpm prisma generate` and restart the server.')
      return NextResponse.json({ error: 'Prisma client missing razorpaySubscription' }, { status: 500 })
    }

    const subscriptions = await prisma.razorpaySubscription.findMany({
      include: { customer: true, user: true }
    })
    const plans = await prisma.subscriptionPlan.findMany()
    return NextResponse.json({ subscriptions, plans })
  } catch (err) {
    console.error('Admin subscriptions error:', err)
    return NextResponse.json({ error: 'Failed to fetch subscriptions', details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }

  // (implicit return already handled above)
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { userId, razorpayPlanId, planTier, customerId } = body

  if (!userId || !razorpayPlanId) {
    return NextResponse.json({ error: 'userId and razorpayPlanId are required' }, { status: 400 })
  }

  // Create or update subscription record
  let sub = await prisma.razorpaySubscription.findFirst({ where: { userId } })
  if (!sub) {
    sub = await prisma.razorpaySubscription.create({
      data: {
        userId,
        customerId: customerId ?? '',
        razorpaySubscriptionId: `manual-${Date.now()}-${userId}`,
        razorpayPlanId,
        status: 'TRIALING',
        planTier: planTier || 'STARTER',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      }
    })
  } else {
    sub = await prisma.razorpaySubscription.update({ where: { id: sub.id }, data: { razorpayPlanId, planTier: planTier || 'STARTER', updatedAt: new Date(), status: 'ACTIVE' } })
  }

  return NextResponse.json({ subscription: sub })
}
