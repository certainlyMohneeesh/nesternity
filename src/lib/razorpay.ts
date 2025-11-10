import crypto from 'crypto';

/**
 * Razorpay Integration Library
 * 
 * This module provides functions to interact with Razorpay's REST API
 * for payment link generation, order creation, and webhook verification.
 * 
 * Uses direct REST API calls instead of SDK for better control and transparency.
 */

// Type definitions
export interface RazorpayPaymentLinkItem {
  name: string;
  amount: number; // Amount in paise (smallest currency unit)
  currency: string;
  description?: string;
  quantity?: number;
}

export interface RazorpayPaymentLinkOptions {
  amount: number; // Total amount in paise
  currency: string;
  description: string;
  customer: {
    name: string;
    email: string;
    contact?: string;
  };
  notify?: {
    sms?: boolean;
    email?: boolean;
  };
  reminder_enable?: boolean;
  callback_url?: string;
  callback_method?: 'get' | 'post';
  reference_id?: string; // Your internal invoice ID
  notes?: Record<string, string>;
  upi_link?: boolean;
}

export interface RazorpayPaymentLink {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  cancelled_at: number;
  created_at: number;
  currency: string;
  description: string;
  expire_by: number | null;
  expired_at: number | null;
  first_min_partial_amount: number | null;
  reference_id: string;
  short_url: string;
  status: 'created' | 'partially_paid' | 'paid' | 'cancelled' | 'expired';
  updated_at: number;
  user_id: string;
  callback_url: string | null;
  callback_method: string | null;
  notes: Record<string, string>;
}

export interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment_link: {
      entity: RazorpayPaymentLink;
    };
    payment?: {
      entity: {
        id: string;
        order_id: string;
        status: string;
        amount: number;
        currency: string;
      };
    };
  };
  created_at: number;
}

/**
 * Get Razorpay credentials from environment variables
 */
function getRazorpayCredentials(userKeyId?: string, userKeySecret?: string) {
  const keyId = userKeyId || process.env.RAZORPAY_KEY_ID;
  const keySecret = userKeySecret || process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  return { keyId, keySecret };
}

/**
 * Create authorization header for Razorpay API
 */
function getAuthHeader(keyId: string, keySecret: string): string {
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Create a Razorpay Payment Link
 * 
 * @param options Payment link options
 * @param userKeyId Optional user-specific Razorpay Key ID
 * @param userKeySecret Optional user-specific Razorpay Key Secret
 * @returns Payment link object
 */
export async function createPaymentLink(
  options: RazorpayPaymentLinkOptions,
  userKeyId?: string,
  userKeySecret?: string
): Promise<RazorpayPaymentLink> {
  try {
    const { keyId, keySecret } = getRazorpayCredentials(userKeyId, userKeySecret);

    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(keyId, keySecret),
      },
      body: JSON.stringify({
        amount: options.amount,
        currency: options.currency,
        description: options.description,
        customer: options.customer,
        notify: options.notify ?? { email: true },
        reminder_enable: options.reminder_enable ?? true,
        callback_url: options.callback_url,
        callback_method: options.callback_method ?? 'get',
        reference_id: options.reference_id,
        notes: options.notes,
        upi_link: options.upi_link ?? true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Razorpay API Error:', error);
      throw new Error(
        `Razorpay API Error: ${error.error?.description || 'Failed to create payment link'}`
      );
    }

    const paymentLink: RazorpayPaymentLink = await response.json();
    return paymentLink;
  } catch (error) {
    console.error('Error creating Razorpay payment link:', error);
    throw error;
  }
}

/**
 * Fetch a Payment Link by ID
 * 
 * @param paymentLinkId Payment link ID
 * @param userKeyId Optional user-specific Razorpay Key ID
 * @param userKeySecret Optional user-specific Razorpay Key Secret
 * @returns Payment link object
 */
export async function getPaymentLink(
  paymentLinkId: string,
  userKeyId?: string,
  userKeySecret?: string
): Promise<RazorpayPaymentLink> {
  try {
    const { keyId, keySecret } = getRazorpayCredentials(userKeyId, userKeySecret);

    const response = await fetch(
      `https://api.razorpay.com/v1/payment_links/${paymentLinkId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(keyId, keySecret),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Razorpay API Error: ${error.error?.description || 'Failed to fetch payment link'}`
      );
    }

    const paymentLink: RazorpayPaymentLink = await response.json();
    return paymentLink;
  } catch (error) {
    console.error('Error fetching Razorpay payment link:', error);
    throw error;
  }
}

/**
 * Cancel a Payment Link
 * 
 * @param paymentLinkId Payment link ID
 * @param userKeyId Optional user-specific Razorpay Key ID
 * @param userKeySecret Optional user-specific Razorpay Key Secret
 * @returns Cancelled payment link object
 */
export async function cancelPaymentLink(
  paymentLinkId: string,
  userKeyId?: string,
  userKeySecret?: string
): Promise<RazorpayPaymentLink> {
  try {
    const { keyId, keySecret } = getRazorpayCredentials(userKeyId, userKeySecret);

    const response = await fetch(
      `https://api.razorpay.com/v1/payment_links/${paymentLinkId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(keyId, keySecret),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Razorpay API Error: ${error.error?.description || 'Failed to cancel payment link'}`
      );
    }

    const paymentLink: RazorpayPaymentLink = await response.json();
    return paymentLink;
  } catch (error) {
    console.error('Error cancelling Razorpay payment link:', error);
    throw error;
  }
}

/**
 * Verify Razorpay webhook signature
 * 
 * This function verifies that the webhook request is genuinely from Razorpay
 * by validating the signature using HMAC SHA256
 * 
 * @param body Raw request body string
 * @param signature Signature from x-razorpay-signature header
 * @param webhookSecret Webhook secret from Razorpay dashboard
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  webhookSecret?: string
): boolean {
  try {
    const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error('Razorpay webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Parse and validate Razorpay webhook event
 * 
 * @param body Raw request body
 * @param signature Signature from header
 * @param webhookSecret Optional webhook secret
 * @returns Parsed webhook event or null if invalid
 */
export function parseWebhookEvent(
  body: string,
  signature: string,
  webhookSecret?: string
): RazorpayWebhookEvent | null {
  try {
    // Verify signature first
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return null;
    }

    // Parse the event
    const event: RazorpayWebhookEvent = JSON.parse(body);
    return event;
  } catch (error) {
    console.error('Error parsing webhook event:', error);
    return null;
  }
}

/**
 * Helper to convert amount from rupees to paise
 * Razorpay expects amounts in the smallest currency unit
 * 
 * @param amount Amount in rupees
 * @returns Amount in paise
 */
export function convertToPaise(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Helper to convert amount from paise to rupees
 * 
 * @param paise Amount in paise
 * @returns Amount in rupees
 */
export function convertToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Check if Razorpay is properly configured
 * 
 * @param userKeyId Optional user-specific key ID
 * @param userKeySecret Optional user-specific key secret
 * @returns boolean
 */
export function isRazorpayConfigured(
  userKeyId?: string,
  userKeySecret?: string
): boolean {
  try {
    const keyId = userKeyId || process.env.RAZORPAY_KEY_ID;
    const keySecret = userKeySecret || process.env.RAZORPAY_KEY_SECRET;
    return !!(keyId && keySecret);
  } catch {
    return false;
  }
}

/**
 * Get payment link status in a human-readable format
 */
export function getPaymentLinkStatusLabel(
  status: RazorpayPaymentLink['status']
): string {
  const statusMap = {
    created: 'Pending',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return statusMap[status] || status;
}
