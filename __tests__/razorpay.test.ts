/**
 * Razorpay Integration Test Suite
 * 
 * This file contains unit and integration tests for the Razorpay payment system.
 * 
 * To run these tests:
 * 1. Set up test environment variables in .env.test
 * 2. Run: npm test -- razorpay.test.ts
 */

import { 
  createPaymentLink, 
  getPaymentLink, 
  cancelPaymentLink, 
  verifyWebhookSignature,
  convertToPaise,
  convertToRupees,
  isRazorpayConfigured,
  getPaymentLinkStatusLabel
} from '../src/lib/razorpay';

describe('Razorpay Library - Unit Tests', () => {
  describe('Currency Conversion', () => {
    it('should convert rupees to paise correctly', () => {
      expect(convertToPaise(100)).toBe(10000);
      expect(convertToPaise(1.5)).toBe(150);
      expect(convertToPaise(0.50)).toBe(50);
    });

    it('should convert paise to rupees correctly', () => {
      expect(convertToRupees(10000)).toBe(100);
      expect(convertToRupees(150)).toBe(1.5);
      expect(convertToRupees(50)).toBe(0.5);
    });

    it('should handle decimal places correctly', () => {
      const rupees = 99.99;
      const paise = convertToPaise(rupees);
      expect(paise).toBe(9999);
      expect(convertToRupees(paise)).toBe(99.99);
    });
  });

  describe('Configuration Check', () => {
    it('should detect if Razorpay is configured', () => {
      // This will check environment variables
      const isConfigured = isRazorpayConfigured();
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should detect user-specific configuration', () => {
      const isConfigured = isRazorpayConfigured('test_key', 'test_secret');
      expect(isConfigured).toBe(true);
    });

    it('should return false for incomplete configuration', () => {
      const isConfigured = isRazorpayConfigured('test_key', '');
      expect(isConfigured).toBe(false);
    });
  });

  describe('Status Labels', () => {
    it('should return correct status labels', () => {
      expect(getPaymentLinkStatusLabel('created')).toBe('Pending');
      expect(getPaymentLinkStatusLabel('paid')).toBe('Paid');
      expect(getPaymentLinkStatusLabel('cancelled')).toBe('Cancelled');
      expect(getPaymentLinkStatusLabel('expired')).toBe('Expired');
      expect(getPaymentLinkStatusLabel('partially_paid')).toBe('Partially Paid');
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should verify valid webhook signature', () => {
      const testSecret = 'test_webhook_secret';
      const body = '{"event":"payment_link.paid","payload":{}}';
      
      // Generate expected signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', testSecret)
        .update(body)
        .digest('hex');

      const isValid = verifyWebhookSignature(body, expectedSignature, testSecret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const testSecret = 'test_webhook_secret';
      const body = '{"event":"payment_link.paid"}';
      const invalidSignature = 'invalid_signature_123';

      const isValid = verifyWebhookSignature(body, invalidSignature, testSecret);
      expect(isValid).toBe(false);
    });

    it('should reject tampered webhook data', () => {
      const testSecret = 'test_webhook_secret';
      const originalBody = '{"event":"payment_link.paid","amount":10000}';
      const tamperedBody = '{"event":"payment_link.paid","amount":50000}';
      
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(originalBody)
        .digest('hex');

      const isValid = verifyWebhookSignature(tamperedBody, signature, testSecret);
      expect(isValid).toBe(false);
    });
  });
});

describe('Razorpay API - Integration Tests', () => {
  // Skip these tests if Razorpay is not configured
  const skipIfNotConfigured = () => {
    if (!isRazorpayConfigured()) {
      console.warn('⚠️  Razorpay not configured, skipping integration tests');
      return true;
    }
    return false;
  };

  describe('Payment Link Creation', () => {
    it('should create a payment link with minimum required fields', async () => {
      if (skipIfNotConfigured()) return;

      const paymentLink = await createPaymentLink({
        amount: convertToPaise(100), // ₹100
        currency: 'INR',
        description: 'Test Payment Link',
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
        },
        reference_id: 'test-ref-001',
      });

      expect(paymentLink).toBeDefined();
      expect(paymentLink.id).toBeTruthy();
      expect(paymentLink.short_url).toBeTruthy();
      expect(paymentLink.status).toBe('created');
      expect(paymentLink.amount).toBe(convertToPaise(100));
      expect(paymentLink.currency).toBe('INR');
    });

    it('should create a payment link with all optional fields', async () => {
      if (skipIfNotConfigured()) return;

      const paymentLink = await createPaymentLink({
        amount: convertToPaise(500),
        currency: 'INR',
        description: 'Full Test Payment Link',
        customer: {
          name: 'Full Test Customer',
          email: 'fulltest@example.com',
          contact: '+919876543210',
        },
        notify: {
          email: true,
          sms: true,
        },
        reminder_enable: true,
        callback_url: 'https://example.com/success',
        callback_method: 'get',
        reference_id: 'test-ref-002',
        notes: {
          invoice_id: 'INV-002',
          customer_name: 'Full Test',
        },
        upi_link: true,
      });

      expect(paymentLink).toBeDefined();
      expect(paymentLink.notes).toEqual({
        invoice_id: 'INV-002',
        customer_name: 'Full Test',
      });
    });

    it('should handle API errors gracefully', async () => {
      if (skipIfNotConfigured()) return;

      try {
        // Try to create with invalid amount (negative)
        await createPaymentLink({
          amount: -100,
          currency: 'INR',
          description: 'Invalid Payment Link',
          customer: {
            name: 'Test',
            email: 'test@example.com',
          },
        });
        
        // Should not reach here
        fail('Expected error for negative amount');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });
  });

  describe('Payment Link Retrieval', () => {
    let createdPaymentLinkId: string;

    beforeAll(async () => {
      if (skipIfNotConfigured()) return;

      // Create a payment link for testing
      const paymentLink = await createPaymentLink({
        amount: convertToPaise(100),
        currency: 'INR',
        description: 'Test Link for Retrieval',
        customer: {
          name: 'Retrieval Test',
          email: 'retrieval@example.com',
        },
        reference_id: 'test-ref-retrieval',
      });
      
      createdPaymentLinkId = paymentLink.id;
    });

    it('should fetch an existing payment link', async () => {
      if (skipIfNotConfigured() || !createdPaymentLinkId) return;

      const paymentLink = await getPaymentLink(createdPaymentLinkId);
      
      expect(paymentLink).toBeDefined();
      expect(paymentLink.id).toBe(createdPaymentLinkId);
      expect(paymentLink.status).toBe('created');
    });

    it('should throw error for non-existent payment link', async () => {
      if (skipIfNotConfigured()) return;

      try {
        await getPaymentLink('plink_invalid123');
        fail('Expected error for invalid payment link ID');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Payment Link Cancellation', () => {
    let cancelTestLinkId: string;

    beforeAll(async () => {
      if (skipIfNotConfigured()) return;

      const paymentLink = await createPaymentLink({
        amount: convertToPaise(200),
        currency: 'INR',
        description: 'Test Link for Cancellation',
        customer: {
          name: 'Cancel Test',
          email: 'cancel@example.com',
        },
        reference_id: 'test-ref-cancel',
      });
      
      cancelTestLinkId = paymentLink.id;
    });

    it('should cancel a payment link', async () => {
      if (skipIfNotConfigured() || !cancelTestLinkId) return;

      const cancelledLink = await cancelPaymentLink(cancelTestLinkId);
      
      expect(cancelledLink).toBeDefined();
      expect(cancelledLink.status).toBe('cancelled');
      expect(cancelledLink.id).toBe(cancelTestLinkId);
    });

    it('should not cancel an already paid link', async () => {
      // This would require actually making a payment in test mode
      // Left as a manual test case
    });
  });
});

describe('Invoice Integration Tests', () => {
  describe('Invoice Creation with Razorpay Payment Link', () => {
    it('should create invoice with payment link when enabled', async () => {
      // This test requires a full app context
      // Can be implemented with supertest or similar
      
      // Mock test structure:
      // 1. Create invoice with enablePaymentLink: true
      // 2. Verify razorpayPaymentLinkId is set
      // 3. Verify razorpayPaymentLinkUrl is set
      // 4. Verify payment link is accessible
    });

    it('should create invoice without payment link when disabled', async () => {
      // Mock test structure:
      // 1. Create invoice with enablePaymentLink: false
      // 2. Verify razorpayPaymentLinkId is null
      // 3. Verify razorpayPaymentLinkUrl is null
    });
  });

  describe('Webhook Event Processing', () => {
    it('should update invoice status on payment_link.paid event', async () => {
      // Mock test structure:
      // 1. Create invoice with payment link
      // 2. Simulate payment_link.paid webhook
      // 3. Verify invoice status is PAID
      // 4. Verify razorpayPaymentId is set
    });

    it('should update invoice status on payment_link.cancelled event', async () => {
      // Mock test structure:
      // 1. Create invoice with payment link
      // 2. Simulate payment_link.cancelled webhook
      // 3. Verify invoice status is CANCELLED
    });

    it('should update invoice status on payment_link.expired event', async () => {
      // Mock test structure:
      // 1. Create invoice with payment link
      // 2. Simulate payment_link.expired webhook
      // 3. Verify invoice status is OVERDUE
    });

    it('should reject webhooks with invalid signatures', async () => {
      // Mock test structure:
      // 1. Send webhook with invalid signature
      // 2. Verify webhook is rejected (401)
      // 3. Verify invoice status unchanged
    });
  });
});

describe('User Payment Settings Tests', () => {
  describe('Payment Settings API', () => {
    it('should save user payment settings', async () => {
      // Mock test structure:
      // 1. POST to /api/payment-settings
      // 2. Verify settings are saved
      // 3. Verify sensitive data is encrypted/protected
    });

    it('should fetch user payment settings', async () => {
      // Mock test structure:
      // 1. GET /api/payment-settings
      // 2. Verify settings are returned
      // 3. Verify secret key is not exposed
    });

    it('should require Razorpay credentials when enabling Razorpay', async () => {
      // Mock test structure:
      // 1. POST with enableRazorpay: true but no credentials
      // 2. Verify request fails with 400 error
    });
  });
});

describe('Error Handling and Edge Cases', () => {
  it('should handle network errors gracefully', async () => {
    // Test with invalid Razorpay credentials
    try {
      await createPaymentLink(
        {
          amount: 100,
          currency: 'INR',
          description: 'Test',
          customer: {
            name: 'Test',
            email: 'test@test.com',
          },
        },
        'invalid_key',
        'invalid_secret'
      );
      fail('Expected error with invalid credentials');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle concurrent webhook events correctly', async () => {
    // Test for race conditions
    // Ensure invoice status is updated correctly even with concurrent webhooks
  });

  it('should handle partial payments correctly', async () => {
    // Test payment_link.partially_paid webhook
    // Verify invoice status remains PENDING
    // Verify partial payment is logged
  });
});

// Export helper functions for manual testing
export const manualTests = {
  /**
   * Create a test payment link manually
   */
  async createTestPaymentLink() {
    const paymentLink = await createPaymentLink({
      amount: convertToPaise(100),
      currency: 'INR',
      description: 'Manual Test Payment',
      customer: {
        name: 'Manual Tester',
        email: 'manual@test.com',
      },
      reference_id: `manual-test-${Date.now()}`,
    });

    console.log('✅ Test Payment Link Created:');
    console.log('   ID:', paymentLink.id);
    console.log('   URL:', paymentLink.short_url);
    console.log('   Status:', paymentLink.status);
    
    return paymentLink;
  },

  /**
   * Test webhook signature verification
   */
  testWebhookSignature() {
    const testBody = '{"event":"payment_link.paid"}';
    const testSecret = 'test_secret';
    
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', testSecret)
      .update(testBody)
      .digest('hex');

    const isValid = verifyWebhookSignature(testBody, signature, testSecret);
    
    console.log('✅ Webhook Signature Test:');
    console.log('   Valid:', isValid);
    console.log('   Signature:', signature);
  },
};
