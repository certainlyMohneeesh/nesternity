import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/lib/dodo';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/dodo/portal
 * 
 * Create a customer portal session for subscription management
 * Allows customers to manage their subscription, payment methods, and billing
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { returnUrl } = body;

    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find customer in our database
    const dodoCustomer = await prisma.dodoCustomer.findUnique({
      where: { userId: user.id },
    });

    if (!dodoCustomer) {
      return NextResponse.json(
        { error: 'Customer not found. Please subscribe first.' },
        { status: 404 }
      );
    }

    // Create portal session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const defaultReturnUrl = `${baseUrl}/dashboard/settings/billing`;
    
    const portalSession = await createCustomerPortalSession(
      dodoCustomer.dodoCustomerId,
      returnUrl || defaultReturnUrl
    );

    return NextResponse.json({
      success: true,
      url: portalSession.url,
      sessionId: portalSession.session_id,
    });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
