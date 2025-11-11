/**
 * GET /api/cron/process-recurring-invoices
 * Daily cron job to process recurring invoices
 * Called by GitHub Actions workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addDays, addWeeks, addMonths, addYears, isPast, isToday } from 'date-fns';
import { generateRecurringInvoiceEmail } from '@/lib/ai/email-templates';
import { createInvoiceNotification, ACTIVITY_TYPES } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting recurring invoice processing...');
    const startTime = Date.now();

    // 2. Find all recurring invoices due today or overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueInvoices = await prisma.invoice.findMany({
      where: {
        isRecurring: true,
        autoGenerateEnabled: true,
        nextIssueDate: {
          lte: today,
        },
        OR: [
          { maxOccurrences: null },
          {
            maxOccurrences: {
              gt: prisma.invoice.fields.occurrenceCount,
            },
          },
        ],
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            createdBy: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    console.log(`📋 Found ${dueInvoices.length} recurring invoices to process`);

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      details: [] as any[],
    };

    // 3. Process each invoice
    for (const parentInvoice of dueInvoices) {
      try {
        console.log(`\n📄 Processing: ${parentInvoice.invoiceNumber}`);

        // Get user's default team for notifications
        const userTeam = await prisma.team.findFirst({
          where: {
            OR: [
              { createdBy: parentInvoice.client.createdBy },
              { members: { some: { userId: parentInvoice.client.createdBy } } }
            ]
          },
          orderBy: { createdAt: 'asc' }, // Get oldest team (likely default)
          select: { id: true }
        });

        // Check max occurrences
        if (parentInvoice.maxOccurrences && parentInvoice.occurrenceCount >= parentInvoice.maxOccurrences) {
          console.log(`⏭️  Skipped - max occurrences reached (${parentInvoice.maxOccurrences})`);
          results.skipped++;
          continue;
        }

        // Generate new invoice number
        const invoiceCount = await prisma.invoice.count({
          where: { issuedById: parentInvoice.issuedById },
        });
        const newInvoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

        // Calculate dates
        const now = new Date();
        const dueDate = addDays(now, 30);

        // Calculate next occurrence
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

        // Create new invoice
        const newInvoice = await prisma.invoice.create({
          data: {
            invoiceNumber: newInvoiceNumber,
            clientId: parentInvoice.clientId,
            issuedById: parentInvoice.issuedById,
            issuedDate: now,
            dueDate,
            status: 'PENDING',
            taxRate: parentInvoice.taxRate,
            discount: parentInvoice.discount,
            currency: parentInvoice.currency,
            notes: parentInvoice.notes,
            isRecurring: false,
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
          },
        });

        // Update parent invoice
        await prisma.invoice.update({
          where: { id: parentInvoice.id },
          data: {
            nextIssueDate,
            occurrenceCount: { increment: 1 },
            lastSentDate: parentInvoice.autoSendEnabled ? now : undefined,
          },
        });

        console.log(`✅ Created invoice: ${newInvoiceNumber}`);

        // Send email if auto-send enabled
        let emailSent = false;
        if (parentInvoice.autoSendEnabled) {
          try {
            const total = newInvoice.items.reduce((sum, item) => sum + item.total, 0);
            const taxAmount = total * ((newInvoice.taxRate || 0) / 100);
            const discountAmount = total * ((newInvoice.discount || 0) / 100);
            const finalTotal = total + taxAmount - discountAmount;

            const emailHtml = await generateRecurringInvoiceEmail({
              clientName: parentInvoice.client.name,
              companyName: parentInvoice.client.company || undefined,
              invoiceNumber: newInvoiceNumber,
              amount: finalTotal,
              dueDate: dueDate.toLocaleDateString(),
              currency: newInvoice.currency,
              recurrence: parentInvoice.recurrence || 'MONTHLY',
              items: newInvoice.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                total: item.total,
              })),
            });

            // TODO: Send email via your email service
            // await sendEmail({
            //   to: parentInvoice.client.email,
            //   cc: parentInvoice.recipientEmails,
            //   subject: `Invoice ${newInvoiceNumber} - ${parentInvoice.client.name}`,
            //   html: emailHtml,
            // });

            emailSent = true;
            console.log(`📧 Email sent to ${parentInvoice.client.email}`);

            // Create notification (only if we have a team)
            if (userTeam) {
              await createInvoiceNotification(
                parentInvoice.issuedById,
                ACTIVITY_TYPES.RECURRING_INVOICE_GENERATED,
                newInvoiceNumber,
                parentInvoice.client.name,
                finalTotal,
                newInvoice.currency,
                { 
                  invoiceId: newInvoice.id,
                  teamId: userTeam.id
                }
              );
            }
          } catch (emailError) {
            console.error(`❌ Email failed:`, emailError);
            
            // Create failure notification (only if we have a team)
            if (userTeam) {
              await createInvoiceNotification(
                parentInvoice.issuedById,
                ACTIVITY_TYPES.RECURRING_INVOICE_FAILED,
                newInvoiceNumber,
                parentInvoice.client.name,
                0,
                newInvoice.currency,
                { 
                  error: emailError instanceof Error ? emailError.message : 'Unknown error',
                  teamId: userTeam.id
                }
              );
            }
          }
        }

        results.processed++;
        results.details.push({
          parentInvoice: parentInvoice.invoiceNumber,
          newInvoice: newInvoiceNumber,
          client: parentInvoice.client.name,
          emailSent,
          nextIssueDate: nextIssueDate.toISOString(),
        });

      } catch (invoiceError) {
        console.error(`❌ Failed to process ${parentInvoice.invoiceNumber}:`, invoiceError);
        results.failed++;
        results.errors.push(`${parentInvoice.invoiceNumber}: ${invoiceError instanceof Error ? invoiceError.message : 'Unknown error'}`);
      }
    }

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        total: dueInvoices.length,
        processed: results.processed,
        failed: results.failed,
        skipped: results.skipped,
      },
      details: results.details,
      errors: results.errors.length > 0 ? results.errors : undefined,
    };

    console.log('\n📊 Processing Summary:');
    console.log(`✅ Processed: ${results.processed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`⏱️  Duration: ${duration}ms`);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process recurring invoices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
