import { NextRequest, NextResponse } from 'next/server'
import { createCustomer, createSubscription } from '@/lib/razorpay'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { userId, name, email, contact, razorpayPlanId, totalCount, quantity } = body
  if (!userId || !email || !razorpayPlanId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  try {
    // Create Razorpay customer
    const customer = await createCustomer({ name, email, contact })

    // Create Razorpay subscription
    const subscription = await createSubscription({ plan_id: razorpayPlanId, customer_id: customer.id, total_count: totalCount || 12, quantity: quantity || 1 })

    // Persist RazorpayCustomer
    const razorpayCustomer = await db.razorpayCustomer.upsert({
      where: { userId },
      create: {
        id: `rc_${Date.now()}_${userId}`,
        userId,
        razorpayCustomerId: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.contact,
      },
      update: {
        razorpayCustomerId: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.contact,
        updatedAt: new Date(),
      },
    })

    // Persist RazorpaySubscription
    const razorpaySub = await db.razorpaySubscription.create({
      data: {
        id: `rs_${Date.now()}_${userId}`,
        userId,
        customerId: razorpayCustomer.id,
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId: subscription.plan_id,
        status: subscription.status as any,
        planTier: 'STARTER',
        quantity: subscription.quantity ?? 1,
        currentPeriodStart: new Date((subscription.current_start || Date.now() / 1000) * 1000),
        currentPeriodEnd: new Date((subscription.current_end || Date.now() / 1000) * 1000),
        shortUrl: subscription.short_url || undefined,
      }
    })

    return NextResponse.json({ customer, subscription: razorpaySub })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
