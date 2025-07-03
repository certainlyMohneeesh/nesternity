import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSafeUser } from '@/lib/safe-auth'
import { stripe, createCheckoutSession, getStripeCustomerId } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const user = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    // Get or create Stripe customer
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let stripeCustomerId = dbUser.stripeCustomerId
    if (!stripeCustomerId) {
      stripeCustomerId = await getStripeCustomerId(user.id, user.email || dbUser.email || '')
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      })
    }

    // Create checkout session
    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'Failed to get Stripe customer ID' }, { status: 500 })
    }
    
    const session = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${req.nextUrl.origin}/dashboard/settings?success=true`,
      `${req.nextUrl.origin}/pricing?canceled=true`
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Cancel subscription at period end
    await stripe.subscriptions.update(subscription.stripeSubId, {
      cancel_at_period_end: true,
    })

    await prisma.subscription.update({
      where: { userId: user.id },
      data: { status: 'canceled' },
    })

    return NextResponse.json({ message: 'Subscription canceled' })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
