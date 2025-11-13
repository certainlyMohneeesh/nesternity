import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 Starting proposal to invoice conversion...');
    const { id } = await context.params;
    console.log('📋 Proposal ID:', id);

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get the proposal with all details
    console.log('🔍 Fetching proposal...');
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
      },
    });

    if (!proposal) {
      console.error('❌ Proposal not found:', id);
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    console.log('✅ Proposal found:', proposal.title);
    console.log('📊 Proposal status:', proposal.status);

    // Check if proposal is accepted
    if (proposal.status !== "ACCEPTED") {
      console.error('❌ Proposal not accepted. Status:', proposal.status);
      return NextResponse.json(
        { error: "Only accepted proposals can be converted to invoices" },
        { status: 400 }
      );
    }

    console.log('✅ Proposal is accepted');

    // Generate invoice number
    console.log('🔢 Generating invoice number...');
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    let invoiceNumber = "INV-0001";
    if (lastInvoice?.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        invoiceNumber = `INV-${String(nextNumber).padStart(4, "0")}`;
      }
    }

    console.log('✅ Invoice number generated:', invoiceNumber);

    // Parse deliverables to create invoice items
    console.log('📦 Parsing deliverables...');
    let items: Array<{ description: string; quantity: number; rate: number; total: number }> = [];
    
    if (proposal.deliverables) {
      try {
        const deliverables = Array.isArray(proposal.deliverables)
          ? proposal.deliverables
          : JSON.parse(proposal.deliverables as string);

        console.log('📦 Deliverables count:', deliverables.length);

        if (Array.isArray(deliverables) && deliverables.length > 0) {
          // Calculate rate per deliverable (divide total by number of deliverables)
          const ratePerItem = proposal.pricing / deliverables.length;
          
          items = deliverables.map((deliverable: any, index: number) => {
            const description = deliverable.item || deliverable.description || deliverable.toString();
            console.log(`  📝 Item ${index + 1}:`, description);
            return {
              description,
              quantity: 1,
              rate: Math.round(ratePerItem * 100) / 100, // Round to 2 decimals
              total: Math.round(ratePerItem * 100) / 100,
            };
          });
        }
      } catch (error) {
        console.error("⚠️  Error parsing deliverables:", error);
      }
    }

    // If no items parsed, create a single item with full amount
    if (items.length === 0) {
      console.log('⚠️  No deliverables found, creating single item');
      items = [
        {
          description: proposal.title || "Project Work",
          quantity: 1,
          rate: proposal.pricing,
          total: proposal.pricing,
        },
      ];
    }

    console.log('✅ Invoice items prepared:', items.length);

    // Create the invoice
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

    console.log('💾 Creating invoice in database...');
    console.log('  📅 Due date:', dueDate.toISOString());
    console.log('  💰 Currency:', proposal.currency);
    console.log('  👤 Client:', proposal.client.name);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: proposal.clientId,
        issuedById: user.id,
        dueDate,
        notes: proposal.paymentTerms 
          ? `Converted from proposal: ${proposal.title}\n\nPayment Terms:\n${proposal.paymentTerms}`
          : `Converted from proposal: ${proposal.title}`,
        taxRate: 0,
        discount: 0,
        currency: proposal.currency,
        status: "PENDING",
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
          })),
        },
      },
      include: {
        client: true,
        issuedBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        items: true,
      },
    });

    console.log('✅ Invoice created successfully!');
    console.log('  🆔 Invoice ID:', invoice.id);
    console.log('  🔢 Invoice Number:', invoice.invoiceNumber);
    console.log('  📊 Total Amount:', invoice.currency, items.reduce((sum, item) => sum + item.total, 0));

    // Generate PDF for the invoice
    console.log('📄 Generating PDF for invoice...');
    try {
      const { generateInvoicePDF } = await import('@/lib/generatePdf');
      
      const invoiceForPDF = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        createdAt: invoice.createdAt,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        taxRate: invoice.taxRate,
        discount: invoice.discount,
        currency: invoice.currency,
        enablePaymentLink: false,
        paymentUrl: null,
        watermarkText: null,
        eSignatureUrl: null,
        client: {
          name: invoice.client.name,
          email: invoice.client.email,
          company: invoice.client.company,
          address: invoice.client.address,
        },
        items: invoice.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          total: item.total,
        })),
      };
      
      console.log('🔧 Starting PDF generation...');
      const pdfUrl = await generateInvoicePDF(invoiceForPDF);
      console.log('✅ PDF generated and uploaded:', pdfUrl);
      
      // Update invoice with PDF URL
      console.log('💾 Updating invoice with PDF URL...');
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl: typeof pdfUrl === 'string' ? pdfUrl : pdfUrl?.toString('base64') },
      });
      console.log('✅ Invoice updated with PDF URL');
    } catch (pdfError) {
      console.error('❌ Error generating PDF for invoice:', pdfError);
      console.error('PDF Error details:', {
        name: pdfError instanceof Error ? pdfError.name : 'Unknown',
        message: pdfError instanceof Error ? pdfError.message : 'Unknown error',
        stack: pdfError instanceof Error ? pdfError.stack : undefined,
      });
      // Continue without PDF - invoice is still created
      console.warn('⚠️  Invoice created successfully but PDF generation failed');
    }

    // Update proposal status to CONVERTED_TO_INVOICE
    console.log('📝 Updating proposal status...');
    await prisma.proposal.update({
      where: { id },
      data: {
        status: "CONVERTED_TO_INVOICE",
      },
    });
    console.log('✅ Proposal status updated to CONVERTED_TO_INVOICE');

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
      message: `Successfully created invoice ${invoiceNumber}`,
    });
  } catch (error) {
    console.error("❌ Convert to invoice error:", error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to convert proposal to invoice" },
      { status: 500 }
    );
  }
}
