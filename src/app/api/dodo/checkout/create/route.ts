import { NextRequest, NextResponse } from 'next/server';
import { createDodoCustomer, createCheckoutSession } from '@/lib/dodo';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/dodo/checkout/create
 * 
 * Create a Dodo Payments checkout session for subscription purchase
 * This replaces the deprecated direct subscription creation API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, name, phone, productId, planTier, successUrl, cancelUrl, metadata } = body;

    // Validate required fields
    if (!userId || !email || !productId || !planTier) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, productId, planTier' },
        { status: 400 }
      );
    }

    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if customer already exists in our database
    let dodoCustomer = await prisma.dodoCustomer.findUnique({
      where: { userId },
    });

    // If customer doesn't exist in Dodo Payments, create one
    if (!dodoCustomer) {
      const newCustomer = await createDodoCustomer({
        email,
        name: name || undefined,
        phone_number: phone || undefined,
        metadata: {
          userId,
          source: 'nesternity',
        },
      });

      // Save to our database
      dodoCustomer = await prisma.dodoCustomer.create({
        data: {
          id: `dc_${Date.now()}_${userId}`,
          userId,
          dodoCustomerId: newCustomer.customer_id,
          email: newCustomer.email,
          name: newCustomer.name || null,
          phone: newCustomer.phone_number || null,
        },
      });
    }

    // Create checkout session for subscription
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: email,
        name: name || undefined,
        phone_number: phone || undefined,
      },
      return_url: successUrl || `${baseUrl}/dashboard/settings/billing?success=true`,
      metadata: {
        userId,
        planTier,
        ...metadata,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.checkout_url,
      sessionId: checkoutSession.checkout_session_id,
      customerId: dodoCustomer.dodoCustomerId,
    });

  } catch (error) {
    console.error('Error creating Dodo checkout session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
