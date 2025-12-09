/**
 * Dodo Payments Integration Library
 * 
 * This module provides functions to interact with Dodo Payments API
 * for subscription management, checkout sessions, and webhooks.
 * 
 * Documentation: https://docs.dodopayments.com
 */

import crypto from 'crypto';

// Environment configuration
const DODO_API_KEY = process.env.DODO_API_KEY;
const DODO_MODE = process.env.DODO_MODE || 'test'; // 'test' or 'live'
const DODO_BASE_URL = DODO_MODE === 'live' 
  ? 'https://live.dodopayments.com'
  : 'https://test.dodopayments.com';

// Type definitions based on Dodo Payments API
export interface DodoCustomer {
  customer_id: string;
  business_id: string;
  email: string;
  name?: string;
  phone_number?: string;
  metadata?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface DodoProduct {
  product_id: string;
  business_id: string;
  name: string;
  description?: string;
  pricing: {
    type: 'recurring' | 'one_time';
    billing_period?: 'monthly' | 'yearly' | 'weekly';
    amount: number;
    currency: string;
  };
  metadata?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface DodoSubscription {
  subscription_id: string;
  customer_id: string;
  product_id: string;
  status: 'active' | 'past_due' | 'cancelled' | 'expired' | 'paused';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  trial_start?: string;
  trial_end?: string;
  metadata?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface DodoPayment {
  payment_id: string;
  customer_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payment_method?: string;
  description?: string;
  metadata?: Record<string, string>;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DodoCheckoutSession {
  checkout_session_id: string;
  business_id: string;
  checkout_url: string; // The URL to redirect customer to
  product_cart: Array<{
    product_id: string;
    quantity: number;
  }>;
  customer?: {
    customer_id?: string;
    email?: string;
    name?: string;
  };
  return_url: string;
  metadata?: Record<string, string>;
  status: 'open' | 'complete' | 'expired';
  created_at: string;
  expires_at?: string;
}

export interface CreateCheckoutSessionParams {
  product_cart: Array<{
    product_id: string;
    quantity: number;
    addons?: Array<{
      addon_id: string;
      quantity: number;
    }>;
    amount?: number; // For pay_what_you_want products
  }>;
  customer?: {
    // For existing customer
    customer_id?: string;
    // For new customer
    email?: string;
    name?: string;
    phone_number?: string;
  };
  return_url: string;
  metadata?: Record<string, string>;
  billing_currency?: string;
  discount_code?: string;
  trial_period_days?: number;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  phone_number?: string;
  metadata?: Record<string, string>;
}

export interface DodoWebhookEvent {
  event: string;
  data: {
    object: any;
  };
  created_at: string;
}

/**
 * Get Dodo Payments API credentials
 */
function getDodoCredentials() {
  if (!DODO_API_KEY) {
    throw new Error('DODO_API_KEY environment variable is not set');
  }
  return DODO_API_KEY;
}

/**
 * Make authenticated request to Dodo Payments API
 */
async function dodoRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getDodoCredentials();
  const url = `${DODO_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(
      `Dodo Payments API Error: ${error.message || error.error?.description || 'Request failed'} (${response.status})`
    );
  }

  return response.json();
}

/**
 * Create a customer in Dodo Payments
 */
export async function createDodoCustomer(
  params: CreateCustomerParams
): Promise<DodoCustomer> {
  return dodoRequest<DodoCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get a customer by ID
 */
export async function getDodoCustomer(customerId: string): Promise<DodoCustomer> {
  return dodoRequest<DodoCustomer>(`/customers/${customerId}`, {
    method: 'GET',
  });
}

/**
 * Update a customer
 */
export async function updateDodoCustomer(
  customerId: string,
  params: Partial<CreateCustomerParams>
): Promise<DodoCustomer> {
  return dodoRequest<DodoCustomer>(`/customers/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}

/**
 * Create a checkout session for subscription
 * Uses the unified checkout endpoint as per documentation
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<DodoCheckoutSession> {
  return dodoRequest<DodoCheckoutSession>('/checkouts', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get a checkout session by ID
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<DodoCheckoutSession> {
  return dodoRequest<DodoCheckoutSession>(`/checkouts/${sessionId}`, {
    method: 'GET',
  });
}

/**
 * List all subscriptions for a customer
 */
export async function listCustomerSubscriptions(
  customerId: string
): Promise<{ data: DodoSubscription[] }> {
  return dodoRequest<{ data: DodoSubscription[] }>(
    `/customers/${customerId}/subscriptions`,
    { method: 'GET' }
  );
}

/**
 * Get subscription details
 */
export async function getDodoSubscription(
  subscriptionId: string
): Promise<DodoSubscription> {
  return dodoRequest<DodoSubscription>(`/subscriptions/${subscriptionId}`, {
    method: 'GET',
  });
}

/**
 * Cancel a subscription
 */
export async function cancelDodoSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<DodoSubscription> {
  return dodoRequest<DodoSubscription>(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancel_at_period_end: cancelAtPeriodEnd }),
  });
}

/**
 * Create customer portal session for subscription management
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<{ url: string; session_id: string }> {
  return dodoRequest<{ url: string; session_id: string }>(
    `/customers/${customerId}/customer-portal/session`,
    {
      method: 'POST',
      body: JSON.stringify({ return_url: returnUrl }),
    }
  );
}

/**
 * List payment methods for a customer
 */
export async function listPaymentMethods(
  customerId: string
): Promise<{ data: any[] }> {
  return dodoRequest<{ data: any[] }>(
    `/customers/${customerId}/payment-methods`,
    { method: 'GET' }
  );
}

/**
 * Verify Dodo Payments webhook signature
 * Note: Implement based on Dodo Payments webhook verification method
 */
export function verifyDodoWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    // Create HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Parse and validate Dodo Payments webhook event
 */
export function parseDodoWebhookEvent(body: string): DodoWebhookEvent {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error('Invalid webhook payload: not valid JSON');
  }
}

/**
 * Map Dodo subscription status to Prisma enum
 */
export function mapDodoSubscriptionStatus(
  status: string
): 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED' {
  const statusMap: Record<string, 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED'> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    cancelled: 'CANCELLED',
    expired: 'EXPIRED',
    paused: 'PAUSED',
  };

  const mapped = statusMap[status.toLowerCase()];

  if (!mapped) {
    throw new Error(`Unknown Dodo subscription status: ${status}`);
  }

  return mapped;
}

/**
 * Map Dodo payment status to Prisma enum
 */
export function mapDodoPaymentStatus(
  status: string
): 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' {
  const statusMap: Record<string, 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'> = {
    pending: 'PENDING',
    succeeded: 'SUCCEEDED',
    failed: 'FAILED',
    refunded: 'REFUNDED',
  };
  const mapped = statusMap[status.toLowerCase()];

  if (!mapped) {
    throw new Error(`Unknown Dodo payment status: ${status}`);
  }

  return mapped;
}
