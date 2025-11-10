import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
