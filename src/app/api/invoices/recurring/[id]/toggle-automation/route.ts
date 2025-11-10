/**
 * PATCH /api/invoices/recurring/[id]/toggle-automation
 * Toggle auto-send automation for recurring invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const { autoSendEnabled, sendDayOfPeriod, recipientEmails } = body;

    // 3. Fetch invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        issuedById: user.id,
        isRecurring: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    console.log(`🔧 Toggling automation for invoice: ${invoice.invoiceNumber}`);
    console.log(`🤖 Auto-send: ${invoice.autoSendEnabled} → ${autoSendEnabled}`);

    // 4. Update automation settings
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        autoSendEnabled: autoSendEnabled !== undefined ? autoSendEnabled : invoice.autoSendEnabled,
        sendDayOfPeriod: sendDayOfPeriod !== undefined ? sendDayOfPeriod : invoice.sendDayOfPeriod,
        recipientEmails: recipientEmails !== undefined ? recipientEmails : invoice.recipientEmails,
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ Automation updated for ${updatedInvoice.invoiceNumber}`);

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: `Automation ${updatedInvoice.autoSendEnabled ? 'enabled' : 'disabled'} for recurring invoice.`,
    });

  } catch (error) {
    console.error('❌ Toggle automation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update automation settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
