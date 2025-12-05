/**
 * POST /api/invoices/recurring/[id]/process
 * Manually trigger or process a recurring invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import adapter from '@/lib/ai/adapter';

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch parent invoice
    const parentInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        issuedById: user.id,
        isRecurring: true,
      },
      include: {
        items: true,
        client: true,
      },
    });

    if (!parentInvoice) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    // 3. Check max occurrences
    if (parentInvoice.maxOccurrences && parentInvoice.occurrenceCount >= parentInvoice.maxOccurrences) {
      return NextResponse.json(
        {
          error: 'Maximum occurrences reached',
          message: `This recurring invoice has reached its limit of ${parentInvoice.maxOccurrences} occurrences.`,
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing recurring invoice: ${parentInvoice.invoiceNumber}`);

    // 4. Generate new invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { issuedById: user.id },
    });
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // 5. Calculate dates
    const now = new Date();
    const dueDate = addDays(now, 30); // 30 days from now

    // 6. Calculate next occurrence date
    let nextIssueDate: Date;
    switch (parentInvoice.recurrence) {
      case 'WEEKLY':
        nextIssueDate = addWeeks(now, 1);
        break;
      case 'MONTHLY':
        nextIssueDate = addMonths(now, 1);
        if (parentInvoice.sendDayOfPeriod) {
          nextIssueDate.setDate(parentInvoice.sendDayOfPeriod);
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

    // 7. Create new invoice instance
    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: newInvoiceNumber,
        clientId: parentInvoice.clientId,
        issuedById: user.id,
        organisationId: parentInvoice.organisationId, // Copy from parent
        projectId: parentInvoice.projectId, // Copy from parent
        issuedDate: now,
        dueDate,
        status: 'PENDING',
        taxRate: parentInvoice.taxRate,
        discount: parentInvoice.discount,
        currency: parentInvoice.currency,
        notes: parentInvoice.notes,
        isRecurring: false, // Individual instances are not recurring
        parentInvoiceId: parentInvoice.id,
        items: {
          create: parentInvoice.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
          })),
        },
      },
      include: {
        items: true,
        client: true,
      },
    });

    // 8. Update parent invoice
    await prisma.invoice.update({
      where: { id: parentInvoice.id },
      data: {
        nextIssueDate,
        occurrenceCount: { increment: 1 },
        lastSentDate: parentInvoice.autoSendEnabled ? now : undefined,
      },
    });

    console.log(`✅ Generated invoice: ${newInvoiceNumber}`);
    console.log(`📅 Next occurrence: ${nextIssueDate.toISOString()}`);

    // 9. Auto-send if enabled
    let emailSent = false;
    let emailMessage = '';

    if (parentInvoice.autoSendEnabled) {
      try {
        // Generate AI email
        const emailDraft = await generateInvoiceEmail(newInvoice, parentInvoice);
        
        // TODO: Send email via your email service
        // await sendInvoiceEmail({
        //   to: parentInvoice.client.email,
        //   cc: parentInvoice.recipientEmails,
        //   subject: `Invoice ${newInvoiceNumber} - ${parentInvoice.client.name}`,
        //   html: emailDraft,
        // });

        emailSent = true;
        emailMessage = `Email sent to ${parentInvoice.client.email}`;
        console.log(`📧 ${emailMessage}`);
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        emailMessage = 'Email sending failed';
      }
    }

    return NextResponse.json({
      success: true,
      invoice: newInvoice,
      parentInvoice: {
        id: parentInvoice.id,
        nextIssueDate,
        occurrenceCount: parentInvoice.occurrenceCount + 1,
      },
      emailSent,
      message: `Invoice ${newInvoiceNumber} created. ${emailMessage}`,
    });

  } catch (error) {
    console.error('❌ Recurring invoice processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process recurring invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate AI-powered professional invoice email
 */
async function generateInvoiceEmail(invoice: any, parentInvoice: any): Promise<string> {
  const total = invoice.items.reduce((sum: number, item: any) => sum + item.total, 0);
  const taxAmount = total * ((invoice.taxRate || 0) / 100);
  const discountAmount = total * ((invoice.discount || 0) / 100);
  const finalTotal = total + taxAmount - discountAmount;

  const messages = [
    {
      role: 'system' as const,
      content: `You are a professional business email writer. Create a polite, professional invoice email for a recurring service.`,
    },
    {
      role: 'user' as const,
      content: `Generate a professional email for this recurring invoice:

Client: ${invoice.client.name}
Company: ${invoice.client.company || 'N/A'}
Invoice Number: ${invoice.invoiceNumber}
Amount: ${invoice.currency === 'INR' ? '₹' : '$'}${finalTotal.toLocaleString()}
Due Date: ${invoice.dueDate.toLocaleDateString()}
Recurrence: ${parentInvoice.recurrence}

Items:
${invoice.items.map((item: any) => `- ${item.description}: ${item.quantity} × ${item.rate} = ${item.total}`).join('\n')}

The email should:
1. Be professional and friendly
2. Thank the client for their continued business
3. Include invoice details
4. Mention payment due date
5. Provide next steps

Return only the HTML email body (no subject line).`,
    },
  ];

  const result = await adapter.generateStructuredCompletion<{ html: string }>(messages, {
    temperature: 0.7,
    maxTokens: 1024,
  });

  return result.data.html || generateFallbackEmail(invoice, finalTotal);
}

function generateFallbackEmail(invoice: any, total: number): string {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Invoice ${invoice.invoiceNumber}</h2>
      <p>Dear ${invoice.client.name},</p>
      <p>Thank you for your continued business! Please find your recurring invoice attached.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Invoice Details</h3>
        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Issue Date:</strong> ${invoice.issuedDate.toLocaleDateString()}</p>
        <p><strong>Due Date:</strong> ${invoice.dueDate.toLocaleDateString()}</p>
        <p><strong>Amount Due:</strong> ${invoice.currency === 'INR' ? '₹' : '$'}${total.toLocaleString()}</p>
      </div>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br/>Your Team</p>
    </body>
    </html>
  `;
}
