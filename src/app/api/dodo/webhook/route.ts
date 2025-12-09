import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { 
  verifyDodoWebhookSignature, 
  parseDodoWebhookEvent,
  mapDodoSubscriptionStatus,
  mapDodoPaymentStatus 
} from '@/lib/dodo';

/**
 * POST /api/dodo/webhook
 * 
 * Handle Dodo Payments webhook events for subscription lifecycle management
 * 
 * Events handled:
 * - payment.succeeded - When a subscription payment succeeds
 * - payment.failed - When a subscription payment fails
 * - subscription.created - When a subscription is created (from checkout)
 * - subscription.updated - When subscription details change
 * - subscription.cancelled - When a subscription is cancelled
 * - subscription.expired - When a subscription expires
 * - subscription.paused - When a subscription is paused
 * - subscription.resumed - When a subscription is resumed
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📥 Dodo Payments webhook received');

    // Get raw body and signature for verification
    const body = await req.text();
    const signature = req.headers.get('x-dodo-signature') || req.headers.get('x-webhook-signature');

    if (!signature) {
      console.error('❌ Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ DODO_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const isValid = verifyDodoWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse event
    const event = parseDodoWebhookEvent(body);
    console.log('✅ Webhook signature verified, event type:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event);
        break;

      case 'subscription.expired':
        await handleSubscriptionExpired(event);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(event);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(event);
        break;

      case 'payment.succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event);
        break;

      default:
        console.log(`⚠️  Unhandled webhook event type: ${event.event}`);
    }

    return NextResponse.json({ received: true, event: event.event });

  } catch (error) {
    console.error('❌ Error processing Dodo webhook:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription.created event
 * Create subscription record in database
 */
async function handleSubscriptionCreated(event: any) {
  try {
    const subscription = event.data.object;
    console.log('🎉 Processing subscription.created:', subscription.subscription_id);

    // Find the customer in our database
    const dodoCustomer = await prisma.dodoCustomer.findUnique({
      where: { dodoCustomerId: subscription.customer_id },
    });

    if (!dodoCustomer) {
      console.error('❌ Customer not found for subscription:', subscription.customer_id);
      return;
    }

    // Extract metadata for plan tier
    const planTier = subscription.metadata?.planTier;
    if (!planTier) {
      throw new Error(
        `Missing planTier metadata for subscription.created event ${subscription.subscription_id}`
      );
    }

    // Create subscription in database
    await prisma.dodoSubscription.create({
      data: {
        id: `ds_${Date.now()}_${dodoCustomer.userId}`,
        userId: dodoCustomer.userId,
        customerId: dodoCustomer.id,
        dodoSubscriptionId: subscription.subscription_id,
        dodoProductId: subscription.product_id,
        status: mapDodoSubscriptionStatus(subscription.status),
        planTier: planTier as any,
        quantity: subscription.quantity || 1,
        currentPeriodStart: new Date(subscription.current_period_start),
        currentPeriodEnd: new Date(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end) : null,
        metadata: subscription.metadata || undefined,
      },
    });

    console.log('✅ Subscription created successfully');

  } catch (error) {
    console.error('❌ Error handling subscription.created:', error);
    throw error;
  }
}

/**
 * Handle subscription.updated event
 * Update subscription details
 */
async function handleSubscriptionUpdated(event: any) {
  try {
    const subscription = event.data.object;
    console.log('📝 Processing subscription.updated:', subscription.subscription_id);

    await prisma.dodoSubscription.updateMany({
      where: { dodoSubscriptionId: subscription.subscription_id },
      data: {
        status: mapDodoSubscriptionStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start),
        currentPeriodEnd: new Date(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        quantity: subscription.quantity || 1,
        metadata: subscription.metadata || undefined,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Subscription updated successfully');

  } catch (error) {
    console.error('❌ Error handling subscription.updated:', error);
    throw error;
  }
}

/**
 * Handle subscription.cancelled event
 */
async function handleSubscriptionCancelled(event: any) {
  try {
    const subscription = event.data.object;
    console.log('🚫 Processing subscription.cancelled:', subscription.subscription_id);

    await prisma.dodoSubscription.updateMany({
      where: { dodoSubscriptionId: subscription.subscription_id },
      data: {
        status: 'CANCELLED',
        canceledAt: new Date(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Subscription cancelled successfully');

  } catch (error) {
    console.error('❌ Error handling subscription.cancelled:', error);
    throw error;
  }
}

/**
 * Handle subscription.expired event
 */
async function handleSubscriptionExpired(event: any) {
  try {
    const subscription = event.data.object;
    console.log('⏰ Processing subscription.expired:', subscription.subscription_id);

    await prisma.dodoSubscription.updateMany({
      where: { dodoSubscriptionId: subscription.subscription_id },
      data: {
        status: 'EXPIRED',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Subscription expired successfully');

  } catch (error) {
    console.error('❌ Error handling subscription.expired:', error);
    throw error;
  }
}

/**
 * Handle subscription.paused event
 */
async function handleSubscriptionPaused(event: any) {
  try {
    const subscription = event.data.object;
    console.log('⏸️  Processing subscription.paused:', subscription.subscription_id);

    await prisma.dodoSubscription.updateMany({
      where: { dodoSubscriptionId: subscription.subscription_id },
      data: {
        status: 'PAUSED',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Subscription paused successfully');

  } catch (error) {
    console.error('❌ Error handling subscription.paused:', error);
    throw error;
  }
}

/**
 * Handle subscription.resumed event
 */
async function handleSubscriptionResumed(event: any) {
  try {
    const subscription = event.data.object;
    console.log('▶️  Processing subscription.resumed:', subscription.subscription_id);

    await prisma.dodoSubscription.updateMany({
      where: { dodoSubscriptionId: subscription.subscription_id },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Subscription resumed successfully');

  } catch (error) {
    console.error('❌ Error handling subscription.resumed:', error);
    throw error;
  }
}

/**
 * Handle payment.succeeded event
 * Record successful payment
 */
async function handlePaymentSucceeded(event: any) {
  try {
    const payment = event.data.object;
    console.log('💰 Processing payment.succeeded:', payment.payment_id);

    // Find customer
    const dodoCustomer = await prisma.dodoCustomer.findUnique({
      where: { dodoCustomerId: payment.customer_id },
    });

    if (!dodoCustomer) {
      console.error('❌ Customer not found for payment:', payment.customer_id);
      return;
    }

    // Find subscription if payment is for a subscription
    let subscriptionId: string | null = null;
    if (payment.subscription_id) {
      const subscription = await prisma.dodoSubscription.findUnique({
        where: { dodoSubscriptionId: payment.subscription_id },
      });
      subscriptionId = subscription?.id || null;
    }

    // Create payment record
    await prisma.dodoPayment.create({
      data: {
        id: `dp_${Date.now()}_${dodoCustomer.userId}`,
        userId: dodoCustomer.userId,
        customerId: dodoCustomer.id,
        subscriptionId,
        dodoPaymentId: payment.payment_id,
        dodoCheckoutId: payment.checkout_session_id || null,
        amount: payment.amount,
        currency: payment.currency,
        status: 'SUCCEEDED',
        paymentMethod: payment.payment_method || null,
        description: payment.description || null,
        metadata: payment.metadata || undefined,
        paidAt: new Date(),
      },
    });

    console.log('✅ Payment recorded successfully');

  } catch (error) {
    console.error('❌ Error handling payment.succeeded:', error);
    throw error;
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(event: any) {
  try {
    const payment = event.data.object;
    console.log('❗ Processing payment.failed:', payment.payment_id);

    // Find customer
    const dodoCustomer = await prisma.dodoCustomer.findUnique({
      where: { dodoCustomerId: payment.customer_id },
    });

    if (!dodoCustomer) {
      console.error('❌ Customer not found for payment:', payment.customer_id);
      return;
    }

    // Find subscription if payment is for a subscription
    let subscriptionId: string | null = null;
    if (payment.subscription_id) {
      const subscription = await prisma.dodoSubscription.findUnique({
        where: { dodoSubscriptionId: payment.subscription_id },
      });
      subscriptionId = subscription?.id || null;

      // Update subscription status to PAST_DUE
      if (subscription) {
        await prisma.dodoSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'PAST_DUE',
            updatedAt: new Date(),
          },
        });
      }
    }

    // Create payment record
    await prisma.dodoPayment.create({
      data: {
        id: `dp_${Date.now()}_${dodoCustomer.userId}`,
        userId: dodoCustomer.userId,
        customerId: dodoCustomer.id,
        subscriptionId,
        dodoPaymentId: payment.payment_id,
        dodoCheckoutId: payment.checkout_session_id || null,
        amount: payment.amount,
        currency: payment.currency,
        status: 'FAILED',
        paymentMethod: payment.payment_method || null,
        description: payment.description || null,
        metadata: payment.metadata || undefined,
      },
    });

    console.log('✅ Failed payment recorded successfully');

  } catch (error) {
    console.error('❌ Error handling payment.failed:', error);
    throw error;
  }
}
