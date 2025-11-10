import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { getLinkedAccount, mapAccountStatus } from '@/lib/razorpay-route';

/**
 * GET /api/razorpay/linked-account
 * Get linked account status from Razorpay and update local database
 */
export async function GET(req: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's payment settings
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { userId: user.id },
    });

    if (!paymentSettings || !paymentSettings.razorpayAccountId) {
      return NextResponse.json(
        { error: 'No linked account found. Please create one first.' },
        { status: 404 }
      );
    }

    // Fetch latest status from Razorpay
    const linkedAccount = await getLinkedAccount(paymentSettings.razorpayAccountId);

    // Update local database with latest status
    const updatedSettings = await prisma.paymentSettings.update({
      where: { userId: user.id },
      data: {
        accountStatus: mapAccountStatus(linkedAccount.status) as any,
        accountActive: linkedAccount.status === 'activated',
        verificationNotes: linkedAccount.error 
          ? `${linkedAccount.error.code}: ${linkedAccount.error.description}`
          : linkedAccount.status === 'activated' 
            ? 'Account activated successfully'
            : 'Verification pending',
      },
      select: {
        id: true,
        razorpayAccountId: true,
        accountStatus: true,
        accountActive: true,
        verificationNotes: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ...updatedSettings,
      razorpayDetails: {
        status: linkedAccount.status,
        type: linkedAccount.type,
        email: linkedAccount.email,
        name: linkedAccount.name,
        phone: linkedAccount.phone,
        legal_business_name: linkedAccount.legal_business_name,
        created_at: linkedAccount.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching linked account status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch account status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/razorpay/linked-account/refresh
 * Manually refresh account status from Razorpay
 */
export async function POST(req: NextRequest) {
  // Same as GET but returns more detailed response
  return GET(req);
}
