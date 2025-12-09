import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { 
  createLinkedAccount, 
  getLinkedAccount, 
  addBankAccount,
  mapAccountStatus 
} from '@/lib/razorpay-route';

/**
 * GET /api/payment-settings
 * Fetch user's payment settings
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

    // Fetch payment settings
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        upiId: true,
        upiMerchantName: true,
        razorpayAccountId: true,
        accountStatus: true,
        accountHolderName: true,
        accountNumber: true,
        ifscCode: true,
        bankName: true,
        branchName: true,
        accountType: true,
        businessName: true,
        gstNumber: true,
        panNumber: true,
        contactEmail: true,
        contactPhone: true,
        businessAddress: true,
        city: true,
        state: true,
        pincode: true,
        country: true,
        enableInternational: true,
        dodoApiKey: true,
        dodoAccountId: true,
        dodoMode: true,
        bankTransferThreshold: true,
        enableCommission: true,
        commissionPercent: true,
        settlementSchedule: true,
        accountActive: true,
        verificationNotes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Return empty settings if not found
    if (!paymentSettings) {
      return NextResponse.json({
        accountStatus: 'PENDING',
        accountActive: false,
        enableCommission: true,
        commissionPercent: 5.0,
        settlementSchedule: 'INSTANT',
        country: 'India',
      });
    }

    return NextResponse.json(paymentSettings);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payment-settings
 * Create or update user's payment settings
 * If bank details are provided, creates/updates Razorpay linked account
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      // India Payments - UPI
      upiId,
      upiMerchantName,
      // India Payments - Bank Transfer
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      accountType,
      bankTransferThreshold,
      // Business Details
      businessName,
      gstNumber,
      panNumber,
      contactEmail,
      contactPhone,
      businessAddress,
      city,
      state,
      pincode,
      country,
      // International Payments
      enableInternational,
      dodoApiKey,
      dodoAccountId,
      dodoMode,
      // Legacy fields
      enableCommission,
      commissionPercent,
      settlementSchedule,
      createLinkedAccountNow, // Flag to create Razorpay linked account
    } = body;

    // Check if this is a request to create linked account
    let razorpayAccountId: string | undefined;
    let accountStatus = 'PENDING';
    let verificationNotes: string | undefined;
    let accountActive = false;

    if (createLinkedAccountNow && panNumber && accountHolderName && contactEmail) {
      try {
        console.log('🔄 Creating Razorpay linked account...');
        
        // Validate required fields for linked account creation
        if (!businessName || !contactPhone || !accountNumber || !ifscCode) {
          console.log('❌ Missing required fields:', {
            businessName: !!businessName,
            contactPhone: !!contactPhone,
            accountNumber: !!accountNumber,
            ifscCode: !!ifscCode,
          });
          return NextResponse.json(
            { 
              error: 'Missing required fields for account creation',
              required: ['businessName', 'contactPhone', 'accountNumber', 'ifscCode', 'panNumber', 'accountHolderName', 'contactEmail']
            },
            { status: 400 }
          );
        }

        console.log('✅ All required fields present, calling createLinkedAccount...');

        // Create linked account on Razorpay
        const linkedAccount = await createLinkedAccount({
          email: contactEmail,
          name: accountHolderName,
          phone: contactPhone,
          legal_business_name: businessName,
          business_type: 'individual', // Default to individual
          customer_facing_business_name: businessName,
          legal_info: {
            pan: panNumber,
            gst: gstNumber,
          },
          contact_info: {
            chargeback_email: contactEmail,
            refund_email: contactEmail,
            dispute_email: contactEmail,
          },
          notes: {
            user_id: user.id,
            user_email: user.email || '',
          },
        });

        console.log('✅ Razorpay linked account created:', linkedAccount.id);

        razorpayAccountId = linkedAccount.id;
        accountStatus = mapAccountStatus(linkedAccount.status);
        accountActive = linkedAccount.status === 'activated';

        // Add bank account to linked account
        if (accountNumber && ifscCode && accountHolderName && accountType) {
          console.log('🔄 Adding bank account to linked account...');
          await addBankAccount(linkedAccount.id, {
            account_number: accountNumber,
            ifsc_code: ifscCode,
            beneficiary_name: accountHolderName,
            account_type: accountType.toLowerCase() as 'savings' | 'current',
          });
          console.log('✅ Bank account added successfully');
        }

        verificationNotes = accountActive 
          ? 'Account activated successfully' 
          : 'Account created, pending verification';

      } catch (error) {
        console.error('❌ Failed to create linked account:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        verificationNotes = error instanceof Error ? error.message : 'Failed to create linked account';
        // Continue with saving other details even if account creation fails
      }
    } else {
      console.log('⚠️ Skipping Razorpay account creation:', {
        createLinkedAccountNow,
        hasPanNumber: !!panNumber,
        hasAccountHolderName: !!accountHolderName,
        hasContactEmail: !!contactEmail,
      });
    }

    // Get existing settings to preserve razorpayAccountId if not creating new
    const existingSettings = await prisma.paymentSettings.findUnique({
      where: { userId: user.id },
    });

    // Upsert payment settings
    const paymentSettings = await prisma.paymentSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        upiId,
        upiMerchantName,
        razorpayAccountId: razorpayAccountId,
        accountStatus: accountStatus as any,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        branchName,
        accountType: accountType as any,
        bankTransferThreshold: bankTransferThreshold ?? 100000,
        businessName,
        gstNumber,
        panNumber,
        contactEmail,
        contactPhone,
        businessAddress,
        city,
        state,
        pincode,
        country: country || 'India',
        enableInternational: enableInternational ?? false,
        dodoApiKey,
        dodoAccountId,
        dodoMode: dodoMode as any || 'TEST',
        enableCommission: enableCommission ?? true,
        commissionPercent: commissionPercent ?? 5.0,
        settlementSchedule: settlementSchedule as any || 'INSTANT',
        accountActive,
        verificationNotes,
      },
      update: {
        ...(upiId !== undefined && { upiId }),
        ...(upiMerchantName !== undefined && { upiMerchantName }),
        ...(razorpayAccountId && { razorpayAccountId }),
        ...(accountStatus && { accountStatus: accountStatus as any }),
        ...(accountHolderName !== undefined && { accountHolderName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(ifscCode !== undefined && { ifscCode }),
        ...(bankName !== undefined && { bankName }),
        ...(branchName !== undefined && { branchName }),
        ...(accountType !== undefined && { accountType: accountType as any }),
        ...(bankTransferThreshold !== undefined && { bankTransferThreshold }),
        ...(businessName !== undefined && { businessName }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(panNumber !== undefined && { panNumber }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(businessAddress !== undefined && { businessAddress }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(country !== undefined && { country }),
        ...(enableInternational !== undefined && { enableInternational }),
        ...(dodoApiKey !== undefined && { dodoApiKey }),
        ...(dodoAccountId !== undefined && { dodoAccountId }),
        ...(dodoMode !== undefined && { dodoMode: dodoMode as any }),
        ...(enableCommission !== undefined && { enableCommission }),
        ...(commissionPercent !== undefined && { commissionPercent }),
        ...(settlementSchedule !== undefined && { settlementSchedule: settlementSchedule as any }),
        ...(verificationNotes !== undefined && { verificationNotes }),
        accountActive,
      },
      select: {
        id: true,
        upiId: true,
        upiMerchantName: true,
        razorpayAccountId: true,
        accountStatus: true,
        accountHolderName: true,
        accountNumber: true,
        ifscCode: true,
        bankName: true,
        branchName: true,
        accountType: true,
        businessName: true,
        gstNumber: true,
        panNumber: true,
        contactEmail: true,
        contactPhone: true,
        businessAddress: true,
        city: true,
        state: true,
        pincode: true,
        country: true,
        enableInternational: true,
        dodoApiKey: true,
        dodoAccountId: true,
        dodoMode: true,
        bankTransferThreshold: true,
        enableCommission: true,
        commissionPercent: true,
        settlementSchedule: true,
        accountActive: true,
        verificationNotes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(paymentSettings);
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save payment settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payment-settings
 * Delete user's payment settings
 */
export async function DELETE(req: NextRequest) {
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

    // Delete payment settings
    await prisma.paymentSettings.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
