import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, note, invoiceId, expiresAt } = body;

    // Get user's payment settings
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { userId: user.id },
    });

    if (!paymentSettings) {
      return NextResponse.json(
        { error: 'Payment settings not found. Please configure your UPI ID first.' },
        { status: 404 }
      );
    }

    if (!paymentSettings.upiId) {
      return NextResponse.json(
        { error: 'UPI ID not configured. Please add your UPI ID in payment settings.' },
        { status: 400 }
      );
    }

    // Check if QR already exists for this invoice
    let upiQr;
    if (invoiceId) {
      const existingQr = await prisma.upiQr.findUnique({
        where: { invoiceId: invoiceId },
      });

      if (existingQr) {
        // Update existing QR instead of creating new one
        upiQr = await prisma.upiQr.update({
          where: { id: existingQr.id },
          data: {
            amount: amount || null,
            note: note || null,
            isActive: true,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        });
      } else {
        // Create new QR
        upiQr = await prisma.upiQr.create({
          data: {
            paymentSettingsId: paymentSettings.id,
            invoiceId: invoiceId,
            amount: amount || null,
            note: note || null,
            currency: 'INR',
            isActive: true,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        });
      }
    } else {
      // Create QR without invoice association
      upiQr = await prisma.upiQr.create({
        data: {
          paymentSettingsId: paymentSettings.id,
          invoiceId: null,
          amount: amount || null,
          note: note || null,
          currency: 'INR',
          isActive: true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
    }

    // Generate payment page URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentPageUrl = `${baseUrl}/pay/${upiQr.id}`;

    // If this is for an invoice, update the invoice with the payment page ID
    if (invoiceId) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paymentPageId: upiQr.id,
          paymentMode: 'UPI',
        },
      });
    }

    return NextResponse.json({
      success: true,
      qrId: upiQr.id,
      paymentPageUrl,
      upiId: paymentSettings.upiId,
      merchantName: paymentSettings.upiMerchantName || paymentSettings.businessName,
      amount: amount,
      note: note,
    });
  } catch (error) {
    console.error('Error generating QR:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve QR details
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const qrId = searchParams.get('qrId');

    if (!qrId) {
      return NextResponse.json({ error: 'QR ID required' }, { status: 400 });
    }

    const upiQr = await prisma.upiQr.findUnique({
      where: { id: qrId },
      include: {
        paymentSettings: {
          select: {
            upiId: true,
            upiMerchantName: true,
            businessName: true,
          },
        },
        visits: {
          orderBy: { visitedAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!upiQr) {
      return NextResponse.json({ error: 'QR not found' }, { status: 404 });
    }

    // Verify ownership
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { id: upiQr.paymentSettingsId },
    });

    if (paymentSettings?.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentPageUrl = `${baseUrl}/pay/${upiQr.id}`;

    return NextResponse.json({
      success: true,
      qr: {
        id: upiQr.id,
        amount: upiQr.amount,
        note: upiQr.note,
        currency: upiQr.currency,
        isActive: upiQr.isActive,
        expiresAt: upiQr.expiresAt,
        createdAt: upiQr.createdAt,
        paymentPageUrl,
        upiId: upiQr.paymentSettings.upiId,
        merchantName:
          upiQr.paymentSettings.upiMerchantName ||
          upiQr.paymentSettings.businessName,
      },
      visits: upiQr.visits,
      analytics: {
        totalVisits: upiQr.visits.length,
        uniqueIps: new Set(upiQr.visits.map((v) => v.ipAddress).filter(Boolean))
          .size,
      },
    });
  } catch (error) {
    console.error('Error fetching QR:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR details' },
      { status: 500 }
    );
  }
}
