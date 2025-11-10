import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature, createTransfer, mapAccountStatus } from '@/lib/razorpay-route';

// Since we moved to Razorpay Route, we need to handle webhook events differently
// Old parseWebhookEvent might not work with Route events
interface RazorpayWebhookEvent {
  event: string;
  payload: any;
  created_at: number;
  contains?: string[];
  account_id?: string;
  entity?: string;
}

/**
 * POST /api/razorpay/webhook
 * 
 * Handle Razorpay Route webhook events for payment status updates and transfers
 * 
 * Events handled:
 * - payment_link.paid - When a payment link is successfully paid → Create transfer
 * - transfer.processed - When transfer to linked account succeeds
 * - transfer.failed - When transfer to linked account fails
 * - payment_link.cancelled - When a payment link is cancelled
 * - payment_link.expired - When a payment link expires
 * - account.activated - When linked account is activated
 * - account.suspended - When linked account is suspended
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📥 Razorpay Route webhook received');

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('❌ Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const isValid = verifyWebhookSignature(body, signature, webhookSecret);

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the event
    const event: RazorpayWebhookEvent = JSON.parse(body);
    console.log('✅ Webhook signature verified, event type:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'payment_link.paid':
        await handlePaymentLinkPaid(event);
        break;

      case 'transfer.processed':
        await handleTransferProcessed(event);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event);
        break;

      case 'payment_link.cancelled':
        await handlePaymentLinkCancelled(event);
        break;

      case 'payment_link.expired':
        await handlePaymentLinkExpired(event);
        break;

      case 'payment_link.partially_paid':
        await handlePaymentLinkPartiallyPaid(event);
        break;

      case 'account.activated':
        await handleAccountActivated(event);
        break;

      case 'account.suspended':
        await handleAccountSuspended(event);
        break;

      default:
        console.log(`⚠️  Unhandled webhook event type: ${event.event}`);
    }

    return NextResponse.json({ received: true, event: event.event });
  } catch (error) {
    console.error('❌ Error processing Razorpay webhook:', error);
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
 * Handle payment_link.paid event
 * Update invoice status to PAID and create transfer to linked account
 */
async function handlePaymentLinkPaid(event: RazorpayWebhookEvent) {
  try {
    const paymentLink = event.payload.payment_link.entity;
    const payment = event.payload.payment?.entity;
    
    console.log('💰 Processing payment_link.paid event:', {
      paymentLinkId: paymentLink.id,
      referenceId: paymentLink.reference_id,
      amount: paymentLink.amount,
      status: paymentLink.status,
    });

    // Find invoice by payment link ID or reference ID
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { razorpayPaymentLinkId: paymentLink.id },
          { id: paymentLink.reference_id }, // reference_id is our invoice ID
        ],
      },
      include: {
        issuedBy: {
          include: {
            paymentSettings: true,
          },
        },
      },
    });

    if (!invoice) {
      console.error('❌ Invoice not found for payment link:', paymentLink.id);
      return;
    }

    console.log('📄 Found invoice:', invoice.invoiceNumber);

    // Update invoice status and payment details
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAID',
        razorpayPaymentLinkStatus: 'paid',
        razorpayPaymentId: payment?.id,
        razorpayOrderId: payment?.order_id,
        paymentMethod: 'UPI', // Default, can be refined based on payment method
        updatedAt: new Date(),
      },
    });

    console.log('✅ Invoice marked as PAID:', invoice.invoiceNumber);

    // Create transfer to user's linked account if applicable
    const paymentSettings = invoice.issuedBy.paymentSettings;
    if (paymentSettings?.razorpayAccountId && payment?.id) {
      try {
        const transferAmount = parseInt(paymentLink.notes?.transfer_amount || paymentLink.amount);
        
        console.log('📤 Creating transfer to linked account:', {
          accountId: paymentSettings.razorpayAccountId,
          amount: transferAmount,
          paymentId: payment.id,
        });

        const transfer = await createTransfer(
          payment.id,
          paymentSettings.razorpayAccountId,
          transferAmount,
          {
            invoice_id: invoice.id,
            invoice_number: invoice.invoiceNumber,
            user_id: invoice.issuedById,
          }
        );

        console.log('✅ Transfer created:', transfer.id);
      } catch (transferError) {
        console.error('❌ Failed to create transfer:', transferError);
        // Don't fail the webhook - transfer can be retried manually
      }
    }
  } catch (error) {
    console.error('❌ Error handling payment_link.paid:', error);
    throw error;
  }
}

/**
 * Handle payment_link.cancelled event
 * Update invoice status to CANCELLED
 */
async function handlePaymentLinkCancelled(event: RazorpayWebhookEvent) {
  try {
    const paymentLink = event.payload.payment_link.entity;
    
    console.log('❌ Processing payment_link.cancelled event:', {
      paymentLinkId: paymentLink.id,
      referenceId: paymentLink.reference_id,
    });

    // Find invoice by payment link ID or reference ID
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { razorpayPaymentLinkId: paymentLink.id },
          { id: paymentLink.reference_id },
        ],
      },
    });

    if (!invoice) {
      console.error('❌ Invoice not found for payment link:', paymentLink.id);
      return;
    }

    // Only update if invoice is not already paid
    if (invoice.status !== 'PAID') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'CANCELLED',
          razorpayPaymentLinkStatus: 'cancelled',
          updatedAt: new Date(),
        },
      });

      console.log('✅ Invoice marked as CANCELLED:', invoice.invoiceNumber);
    } else {
      console.log('⚠️  Invoice already paid, skipping cancellation:', invoice.invoiceNumber);
    }
  } catch (error) {
    console.error('❌ Error handling payment_link.cancelled:', error);
    throw error;
  }
}

/**
 * Handle payment_link.expired event
 * Update invoice status to OVERDUE
 */
async function handlePaymentLinkExpired(event: RazorpayWebhookEvent) {
  try {
    const paymentLink = event.payload.payment_link.entity;
    
    console.log('⏰ Processing payment_link.expired event:', {
      paymentLinkId: paymentLink.id,
      referenceId: paymentLink.reference_id,
    });

    // Find invoice by payment link ID or reference ID
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { razorpayPaymentLinkId: paymentLink.id },
          { id: paymentLink.reference_id },
        ],
      },
    });

    if (!invoice) {
      console.error('❌ Invoice not found for payment link:', paymentLink.id);
      return;
    }

    // Only update if invoice is not already paid
    if (invoice.status !== 'PAID') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'OVERDUE',
          razorpayPaymentLinkStatus: 'expired',
          updatedAt: new Date(),
        },
      });

      console.log('✅ Invoice marked as OVERDUE:', invoice.invoiceNumber);
    } else {
      console.log('⚠️  Invoice already paid, skipping expiry:', invoice.invoiceNumber);
    }
  } catch (error) {
    console.error('❌ Error handling payment_link.expired:', error);
    throw error;
  }
}

/**
 * Handle payment_link.partially_paid event
 * Log the event (status remains PENDING)
 */
async function handlePaymentLinkPartiallyPaid(event: RazorpayWebhookEvent) {
  try {
    const paymentLink = event.payload.payment_link.entity;
    
    console.log('💵 Processing payment_link.partially_paid event:', {
      paymentLinkId: paymentLink.id,
      referenceId: paymentLink.reference_id,
      amountPaid: paymentLink.amount_paid,
      totalAmount: paymentLink.amount,
    });

    // Find invoice by payment link ID or reference ID
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { razorpayPaymentLinkId: paymentLink.id },
          { id: paymentLink.reference_id },
        ],
      },
    });

    if (!invoice) {
      console.error('❌ Invoice not found for payment link:', paymentLink.id);
      return;
    }

    // Update payment link status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        razorpayPaymentLinkStatus: 'partially_paid',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Invoice updated for partial payment:', invoice.invoiceNumber);
  } catch (error) {
    console.error('❌ Error handling payment_link.partially_paid:', error);
    throw error;
  }
}

/**
 * Handle transfer.processed event
 * Log successful transfer completion
 */
async function handleTransferProcessed(event: RazorpayWebhookEvent) {
  try {
    const transfer = event.payload.transfer?.entity;
    
    if (!transfer) {
      console.warn('⚠️ No transfer entity in event payload');
      return;
    }

    console.log('✅ Transfer processed successfully:', {
      transferId: transfer.id,
      amount: transfer.amount,
      recipient: transfer.recipient,
      source: transfer.source,
    });

    // Optional: Update invoice with transfer ID for tracking
    if (transfer.notes?.invoice_id) {
      await prisma.invoice.update({
        where: { id: transfer.notes.invoice_id },
        data: {
          notes: {
            ...(typeof transfer.notes === 'object' ? transfer.notes : {}),
            transfer_id: transfer.id,
            transfer_status: 'processed',
            transfer_processed_at: new Date().toISOString(),
          },
        },
      });

      console.log('📝 Updated invoice with transfer details:', transfer.notes.invoice_id);
    }
  } catch (error) {
    console.error('❌ Error handling transfer.processed:', error);
    throw error;
  }
}

/**
 * Handle transfer.failed event
 * Log failed transfer and update invoice for manual intervention
 */
async function handleTransferFailed(event: RazorpayWebhookEvent) {
  try {
    const transfer = event.payload.transfer?.entity;
    
    if (!transfer) {
      console.warn('⚠️ No transfer entity in event payload');
      return;
    }

    console.error('❌ Transfer failed:', {
      transferId: transfer.id,
      amount: transfer.amount,
      recipient: transfer.recipient,
      source: transfer.source,
      error: transfer.error,
    });

    // Update invoice with failed transfer status for manual review
    if (transfer.notes?.invoice_id) {
      await prisma.invoice.update({
        where: { id: transfer.notes.invoice_id },
        data: {
          notes: {
            ...(typeof transfer.notes === 'object' ? transfer.notes : {}),
            transfer_id: transfer.id,
            transfer_status: 'failed',
            transfer_failed_at: new Date().toISOString(),
            transfer_error: transfer.error?.description || 'Unknown error',
            requires_manual_intervention: true,
          },
        },
      });

      console.log('⚠️ Invoice marked for manual intervention:', transfer.notes.invoice_id);
    }

    // TODO: Send notification to admin/user about failed transfer
  } catch (error) {
    console.error('❌ Error handling transfer.failed:', error);
    throw error;
  }
}

/**
 * Handle account.activated event
 * Update payment settings when linked account is activated
 */
async function handleAccountActivated(event: RazorpayWebhookEvent) {
  try {
    const account = event.payload.account?.entity;
    
    if (!account) {
      console.warn('⚠️ No account entity in event payload');
      return;
    }

    console.log('✅ Account activated:', {
      accountId: account.id,
      email: account.email,
    });

    // Find and update payment settings
    const paymentSettings = await prisma.paymentSettings.findFirst({
      where: { razorpayAccountId: account.id },
      include: { user: true },
    });

    if (!paymentSettings) {
      console.warn('⚠️ Payment settings not found for account:', account.id);
      return;
    }

    await prisma.paymentSettings.update({
      where: { id: paymentSettings.id },
      data: {
        accountStatus: 'ACTIVE',
        accountActive: true,
        verificationNotes: 'Account activated by Razorpay',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Payment settings updated for user:', paymentSettings.user.email);
    // TODO: Send notification to user about account activation
  } catch (error) {
    console.error('❌ Error handling account.activated:', error);
    throw error;
  }
}

/**
 * Handle account.suspended event
 * Update payment settings when linked account is suspended
 */
async function handleAccountSuspended(event: RazorpayWebhookEvent) {
  try {
    const account = event.payload.account?.entity;
    
    if (!account) {
      console.warn('⚠️ No account entity in event payload');
      return;
    }

    console.warn('⚠️ Account suspended:', {
      accountId: account.id,
      email: account.email,
      reason: account.suspended_reason,
    });

    // Find and update payment settings
    const paymentSettings = await prisma.paymentSettings.findFirst({
      where: { razorpayAccountId: account.id },
      include: { user: true },
    });

    if (!paymentSettings) {
      console.warn('⚠️ Payment settings not found for account:', account.id);
      return;
    }

    await prisma.paymentSettings.update({
      where: { id: paymentSettings.id },
      data: {
        accountStatus: 'SUSPENDED',
        accountActive: false,
        verificationNotes: `Account suspended: ${account.suspended_reason || 'No reason provided'}`,
        updatedAt: new Date(),
      },
    });

    console.log('⚠️ Payment settings suspended for user:', paymentSettings.user.email);
    // TODO: Send notification to user about account suspension
  } catch (error) {
    console.error('❌ Error handling account.suspended:', error);
    throw error;
  }
}

