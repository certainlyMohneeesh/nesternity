/**
 * Razorpay Route Integration Library
 * 
 * This library implements Razorpay Route (equivalent to Stripe Connect)
 * for managing linked accounts and automatic fund transfers.
 * 
 * Documentation: https://razorpay.com/docs/route/
 */

import crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LinkedAccountParams {
  email: string;
  name: string;
  phone: string;
  legal_business_name: string;
  business_type: 'individual' | 'proprietorship' | 'partnership' | 'llp' | 'private_limited' | 'public_limited';
  customer_facing_business_name?: string;
  legal_info: {
    pan: string;
    gst?: string;
  };
  contact_info: {
    chargeback_email?: string;
    refund_email?: string;
    dispute_email?: string;
  };
  brand?: {
    color?: string;
  };
  notes?: Record<string, string>;
}

export interface BankAccountParams {
  account_number: string;
  ifsc_code: string;
  beneficiary_name: string;
  account_type: 'savings' | 'current';
}

export interface PaymentLinkWithTransferParams {
  amount: number; // in paise
  currency: string;
  description: string;
  customer: {
    name: string;
    email: string;
    contact?: string;
  };
  reference_id: string;
  linked_account_id: string;
  transfer_amount: number; // in paise (after commission)
  settlement_schedule?: 'instant' | 'daily' | 'weekly' | 'monthly';
  notes?: Record<string, string>;
}

export interface LinkedAccountResponse {
  id: string;
  type: string;
  status: 'created' | 'activated' | 'needs_clarification' | 'suspended';
  email: string;
  name: string;
  phone: string;
  legal_business_name: string;
  business_type: string;
  customer_facing_business_name?: string;
  legal_info: {
    pan: string;
    gst?: string;
  };
  created_at: number;
  error?: {
    code: string;
    description: string;
    field?: string;
  };
}

export interface TransferResponse {
  id: string;
  entity: string;
  source: string;
  recipient: string;
  amount: number;
  currency: string;
  amount_reversed: number;
  notes: Record<string, string>;
  linked_account_notes: string[];
  on_hold: boolean;
  on_hold_until: number | null;
  recipient_settlement_id: string | null;
  created_at: number;
  processed_at: number | null;
  error?: {
    code: string;
    description: string;
  };
}

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const RAZORPAY_MASTER_KEY_ID = process.env.RAZORPAY_MASTER_KEY_ID;
const RAZORPAY_MASTER_KEY_SECRET = process.env.RAZORPAY_MASTER_KEY_SECRET;
const RAZORPAY_COMMISSION_ENABLED = process.env.RAZORPAY_COMMISSION_ENABLED === 'true';
const RAZORPAY_COMMISSION_PERCENT = parseFloat(process.env.RAZORPAY_COMMISSION_PERCENT || '5.0');

const API_BASE_URL = 'https://api.razorpay.com/v2';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create authorization header for Razorpay API
 */
function getAuthHeader(): string {
  if (!RAZORPAY_MASTER_KEY_ID || !RAZORPAY_MASTER_KEY_SECRET) {
    throw new Error('Razorpay master credentials not configured');
  }
  const auth = Buffer.from(`${RAZORPAY_MASTER_KEY_ID}:${RAZORPAY_MASTER_KEY_SECRET}`).toString('base64');
  return `Basic ${auth}`;
}

/**
 * Make authenticated request to Razorpay API
 */
async function razorpayRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: unknown
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Razorpay API Error: ${data.error?.description || 'Unknown error'} (${data.error?.code || response.status})`
    );
  }

  return data as T;
}

/**
 * Calculate commission and transfer amount
 */
export function calculateCommission(totalAmount: number, enableCommission: boolean, commissionPercent: number) {
  if (!enableCommission) {
    return {
      totalAmount,
      commission: 0,
      transferAmount: totalAmount,
      commissionPercent: 0,
    };
  }

  const commission = Math.round(totalAmount * (commissionPercent / 100));
  const transferAmount = totalAmount - commission;

  return {
    totalAmount,
    commission,
    transferAmount,
    commissionPercent,
  };
}

/**
 * Convert rupees to paise
 */
export function convertToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees
 */
export function convertToRupees(paise: number): number {
  return paise / 100;
}

// ============================================================================
// LINKED ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Create a new linked account (sub-merchant) on Razorpay
 * 
 * @param params - Account creation parameters
 * @returns Linked account details
 */
export async function createLinkedAccount(
  params: LinkedAccountParams
): Promise<LinkedAccountResponse> {
  try {
    const response = await razorpayRequest<LinkedAccountResponse>(
      '/accounts',
      'POST',
      params
    );
    return response;
  } catch (error) {
    console.error('Failed to create linked account:', error);
    throw error;
  }
}

/**
 * Get linked account details by ID
 * 
 * @param accountId - Razorpay linked account ID
 * @returns Account details including status
 */
export async function getLinkedAccount(
  accountId: string
): Promise<LinkedAccountResponse> {
  try {
    const response = await razorpayRequest<LinkedAccountResponse>(
      `/accounts/${accountId}`,
      'GET'
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch linked account:', error);
    throw error;
  }
}

/**
 * Update linked account details
 * 
 * @param accountId - Razorpay linked account ID
 * @param updates - Fields to update
 * @returns Updated account details
 */
export async function updateLinkedAccount(
  accountId: string,
  updates: Partial<LinkedAccountParams>
): Promise<LinkedAccountResponse> {
  try {
    const response = await razorpayRequest<LinkedAccountResponse>(
      `/accounts/${accountId}`,
      'PATCH',
      updates
    );
    return response;
  } catch (error) {
    console.error('Failed to update linked account:', error);
    throw error;
  }
}

/**
 * Add bank account to linked account
 * 
 * @param accountId - Razorpay linked account ID
 * @param bankDetails - Bank account details
 * @returns Stakeholder response
 */
export async function addBankAccount(
  accountId: string,
  bankDetails: BankAccountParams
): Promise<unknown> {
  try {
    const response = await razorpayRequest(
      `/accounts/${accountId}/stakeholders`,
      'POST',
      {
        bank_account: bankDetails,
      }
    );
    return response;
  } catch (error) {
    console.error('Failed to add bank account:', error);
    throw error;
  }
}

// ============================================================================
// PAYMENT LINK WITH TRANSFERS
// ============================================================================

/**
 * Create payment link with automatic transfer to linked account
 * 
 * This creates a payment link where:
 * 1. Customer pays the full amount
 * 2. Platform receives payment
 * 3. Razorpay automatically transfers (amount - commission) to user's linked account
 * 
 * @param params - Payment link parameters
 * @returns Payment link details with transfer configuration
 */
export async function createPaymentLinkWithTransfer(
  params: PaymentLinkWithTransferParams
): Promise<{
  id: string;
  short_url: string;
  amount: number;
  currency: string;
  description: string;
  reference_id: string;
  status: string;
  transfers: TransferResponse[];
}> {
  try {
    // Calculate commission
    const commissionData = calculateCommission(
      params.amount,
      RAZORPAY_COMMISSION_ENABLED,
      RAZORPAY_COMMISSION_PERCENT
    );

    // Use provided transfer amount or calculated amount
    const transferAmount = params.transfer_amount || commissionData.transferAmount;

    // Create payment link with transfer configuration
    const paymentLinkData = {
      amount: params.amount,
      currency: params.currency,
      accept_partial: false,
      description: params.description,
      customer: params.customer,
      reference_id: params.reference_id,
      notes: params.notes || {},
      callback_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/invoices',
      callback_method: 'get',
      options: {
        checkout: {
          name: process.env.NEXT_PUBLIC_APP_NAME || 'Nesternity',
        },
      },
    };

    // First create the payment link using v1 API
    const paymentLinkResponse = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentLinkData),
    });

    const paymentLink = await paymentLinkResponse.json();

    if (!paymentLinkResponse.ok) {
      throw new Error(
        `Failed to create payment link: ${paymentLink.error?.description || 'Unknown error'}`
      );
    }

    // Note: Transfers are created after payment is successful via webhook
    // Store the transfer configuration in notes for webhook processing
    paymentLink.transfer_config = {
      linked_account_id: params.linked_account_id,
      transfer_amount: transferAmount,
      settlement_schedule: params.settlement_schedule || 'instant',
    };

    return paymentLink;
  } catch (error) {
    console.error('Failed to create payment link with transfer:', error);
    throw error;
  }
}

/**
 * Create transfer to linked account after payment success
 * 
 * This is called by webhook after payment is successful
 * 
 * @param paymentId - Razorpay payment ID
 * @param linkedAccountId - Recipient linked account ID
 * @param amount - Amount to transfer (in paise)
 * @param notes - Additional notes
 * @returns Transfer details
 */
export async function createTransfer(
  paymentId: string,
  linkedAccountId: string,
  amount: number,
  notes?: Record<string, string>
): Promise<TransferResponse> {
  try {
    const response = await razorpayRequest<TransferResponse>(
      `/payments/${paymentId}/transfers`,
      'POST',
      {
        transfers: [
          {
            account: linkedAccountId,
            amount: amount,
            currency: 'INR',
            notes: notes || {},
            linked_account_notes: ['Invoice payment transfer'],
            on_hold: false, // Release immediately
          },
        ],
      }
    );
    return response;
  } catch (error) {
    console.error('Failed to create transfer:', error);
    throw error;
  }
}

/**
 * Get transfer details
 * 
 * @param transferId - Razorpay transfer ID
 * @returns Transfer details
 */
export async function getTransfer(transferId: string): Promise<TransferResponse> {
  try {
    const response = await razorpayRequest<TransferResponse>(
      `/transfers/${transferId}`,
      'GET'
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch transfer:', error);
    throw error;
  }
}

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify Razorpay webhook signature
 * 
 * @param payload - Webhook payload (raw string)
 * @param signature - X-Razorpay-Signature header
 * @param secret - Webhook secret
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

// ============================================================================
// STATUS MAPPING
// ============================================================================

/**
 * Map Razorpay account status to our AccountStatus enum
 */
export function mapAccountStatus(razorpayStatus: string): string {
  const statusMap: Record<string, string> = {
    'created': 'PENDING',
    'activated': 'ACTIVE',
    'needs_clarification': 'NEEDS_CLARIFICATION',
    'suspended': 'SUSPENDED',
  };
  return statusMap[razorpayStatus] || 'PENDING';
}

/**
 * Map settlement schedule to Razorpay format
 */
export function mapSettlementSchedule(schedule: string): string {
  const scheduleMap: Record<string, string> = {
    'INSTANT': 'instant',
    'DAILY': 'daily',
    'WEEKLY': 'weekly',
    'MONTHLY': 'monthly',
  };
  return scheduleMap[schedule] || 'instant';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createLinkedAccount,
  getLinkedAccount,
  updateLinkedAccount,
  addBankAccount,
  createPaymentLinkWithTransfer,
  createTransfer,
  getTransfer,
  verifyWebhookSignature,
  calculateCommission,
  convertToPaise,
  convertToRupees,
  mapAccountStatus,
  mapSettlementSchedule,
};
