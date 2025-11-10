/**
 * POST /api/invoices/recurring/create
 * Create a recurring invoice template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';

interface RecurringInvoiceRequest {
  clientId: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
  recurrence: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  taxRate?: number;
  discount?: number;
  currency?: string;
  notes?: string;
  
  // Automation settings
  autoSendEnabled: boolean;
  sendDayOfPeriod?: number; // Day of month (1-31) or week (1-7)
  recipientEmails?: string[];
  maxOccurrences?: number; // null = infinite
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json() as RecurringInvoiceRequest;
    const {
      clientId,
      items,
      recurrence,
      taxRate = 0,
      discount = 0,
      currency = 'INR',
      notes,
      autoSendEnabled,
      sendDayOfPeriod,
      recipientEmails = [],
      maxOccurrences,
    } = body;

    // 3. Validate
    if (!clientId || !items || items.length === 0 || !recurrence) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, items, recurrence' },
        { status: 400 }
      );
    }

    // 4. Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        createdBy: user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    console.log(`📄 Creating recurring invoice for client: ${client.name}`);

    // 5. Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate;
      return sum + itemTotal;
    }, 0);

    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal + taxAmount - discountAmount;

    // 6. Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { issuedById: user.id },
    });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // 7. Calculate next issue date
    const now = new Date();
    let nextIssueDate: Date;

    switch (recurrence) {
      case 'WEEKLY':
        nextIssueDate = addWeeks(now, 1);
        break;
      case 'MONTHLY':
        nextIssueDate = addMonths(now, 1);
        // If sendDayOfPeriod is set, use that day of month
        if (sendDayOfPeriod && sendDayOfPeriod >= 1 && sendDayOfPeriod <= 31) {
          nextIssueDate.setDate(sendDayOfPeriod);
          // If we've passed that day this month, move to next month
          if (nextIssueDate <= now) {
            nextIssueDate = addMonths(nextIssueDate, 1);
          }
        }
        break;
      case 'QUARTERLY':
        nextIssueDate = addMonths(now, 3);
        break;
      case 'YEARLY':
        nextIssueDate = addYears(now, 1);
        break;
      default:
        nextIssueDate = addMonths(now, 1);
    }

    const dueDate = addDays(nextIssueDate, 30); // 30 days after issue

    // 8. Create recurring invoice template
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        issuedById: user.id,
        issuedDate: now,
        dueDate,
        status: 'PENDING',
        taxRate,
        discount,
        currency,
        notes,
        isRecurring: true,
        recurrence,
        nextIssueDate,
        autoSendEnabled,
        sendDayOfPeriod,
        recipientEmails,
        autoGenerateEnabled: true,
        maxOccurrences,
        occurrenceCount: 0,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.quantity * item.rate,
          })),
        },
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
      },
    });

    console.log(`✅ Recurring invoice template created: ${invoiceNumber}`);
    console.log(`📅 Next issue date: ${nextIssueDate.toISOString()}`);
    console.log(`🤖 Auto-send: ${autoSendEnabled ? 'Enabled' : 'Disabled'}`);

    return NextResponse.json({
      success: true,
      invoice,
      message: `Recurring invoice created. ${autoSendEnabled ? 'Will auto-send to client.' : 'Manual sending required.'}`,
    });

  } catch (error) {
    console.error('❌ Recurring invoice creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create recurring invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
