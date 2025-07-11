import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const where: any = {
      issuedById: user.id,
    };

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('📧 Invoice creation request received');
    
    // Get auth token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error('❌ No authorization token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Invalid authorization token:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const body = await req.json();
    console.log('📋 Invoice data received:', {
      invoiceNumber: body.invoiceNumber,
      clientId: body.clientId,
      itemCount: body.items?.length || 0,
      enablePaymentLink: body.enablePaymentLink
    });

    const {
      invoiceNumber,
      clientId,
      dueDate,
      notes,
      taxRate,
      discount,
      currency,
      isRecurring,
      recurrence,
      nextIssueDate,
      items,
      enablePaymentLink,
      watermarkText,
      eSignatureUrl,
    } = body;

    if (!invoiceNumber || !clientId || !dueDate || !items || items.length === 0) {
      console.error('❌ Missing required fields:', {
        hasInvoiceNumber: !!invoiceNumber,
        hasClientId: !!clientId,
        hasDueDate: !!dueDate,
        hasItems: !!items,
        itemCount: items?.length || 0
      });
      return NextResponse.json(
        { error: 'Invoice number, client, due date, and items are required' },
        { status: 400 }
      );
    }

    // Verify client belongs to user (either directly or through team access)
    console.log('🔍 Verifying client access for clientId:', clientId);
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        OR: [
          // Direct ownership
          { createdBy: user.id },
          // Access through team projects
          {
            projects: {
              some: {
                team: {
                  members: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              }
            }
          }
        ]
      },
    });

    if (!client) {
      console.error('❌ Client not found or access denied for clientId:', clientId);
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 });
    }

    console.log('✅ Client access verified:', client.name);

    // Calculate totals for each item
    const processedItems = items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      total: item.quantity * item.rate,
    }));

    const subtotal = processedItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const taxAmount = subtotal * ((taxRate || 0) / 100);
    const discountAmount = subtotal * ((discount || 0) / 100);
    const total = subtotal + taxAmount - discountAmount;

    console.log('💰 Invoice totals calculated:', {
      subtotal,
      taxAmount,
      discountAmount,
      total,
      currency: currency || 'INR'
    });

    console.log('💾 Creating invoice in database...');
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        issuedById: user.id,
        dueDate: new Date(dueDate),
        notes,
        taxRate: taxRate || 0,
        discount: discount || 0,
        currency: currency || 'INR',
        isRecurring: isRecurring || false,
        recurrence,
        nextIssueDate: nextIssueDate ? new Date(nextIssueDate) : null,
        enablePaymentLink: enablePaymentLink || false,
        watermarkText: watermarkText || null,
        eSignatureUrl: eSignatureUrl || null,
        items: {
          create: processedItems,
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    console.log('✅ Invoice created successfully:', invoice.id);

    // Generate PDF if requested or if enablePaymentLink is true
    if (enablePaymentLink) {
      console.log('📄 PDF generation requested, starting process...');
      try {
        // Generate payment URL first if needed
        let paymentUrl = null;
        if (enablePaymentLink) {
          console.log('💳 Generating payment link...');
          try {
            // Import stripe temporarily to create payment link
            const { stripe } = await import('@/lib/stripe');
            
            // Create line items for Stripe
            const lineItems = processedItems.map((item: any) => ({
              price_data: {
                currency: (currency || 'INR').toLowerCase(),
                product_data: {
                  name: item.description,
                },
                unit_amount: Math.round(item.rate * 100), // Convert to cents
              },
              quantity: item.quantity,
            }));

            // Add tax as a separate line item if applicable
            if (taxAmount > 0) {
              lineItems.push({
                price_data: {
                  currency: (currency || 'INR').toLowerCase(),
                  product_data: {
                    name: `Tax (${taxRate || 0}%)`,
                  },
                  unit_amount: Math.round(taxAmount * 100),
                },
                quantity: 1,
              });
            }

            // Prepare discount coupon if applicable
            let discounts = undefined;
            if (discountAmount > 0) {
              const coupon = await stripe.coupons.create({
                percent_off: discount,
                duration: 'once',
                name: `Discount (${discount}%)`,
              });
              
              discounts = [{
                coupon: coupon.id
              }];
            }

            // Create Stripe checkout session
            const sessionData: any = {
              payment_method_types: ['card'],
              line_items: lineItems,
              mode: 'payment',
              success_url: `${req.nextUrl.origin}/dashboard/invoices/${invoice.id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${req.nextUrl.origin}/dashboard/invoices/${invoice.id}?payment=cancelled`,
              metadata: {
                invoiceId: invoice.id,
                userId: user.id,
              },
              customer_email: client.email,
              invoice_creation: {
                enabled: true,
                invoice_data: {
                  description: `Payment for Invoice ${invoice.invoiceNumber}`,
                  metadata: {
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                  },
                },
              },
            };

            if (discounts) {
              sessionData.discounts = discounts;
            }

            const session = await stripe.checkout.sessions.create(sessionData);
            paymentUrl = session.url;
            console.log('✅ Payment link generated:', paymentUrl);
          } catch (paymentError) {
            console.error('❌ Failed to generate payment link:', paymentError);
            // Continue without payment link
          }
        }

        // Import the PDF generation function
        const { generateInvoicePDF } = await import('@/lib/generatePdf');
        
        // Create invoice data for PDF generation
        const invoiceForPDF = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          createdAt: invoice.createdAt,
          dueDate: invoice.dueDate,
          notes: invoice.notes,
          taxRate: invoice.taxRate,
          discount: invoice.discount,
          currency: invoice.currency,
          enablePaymentLink: enablePaymentLink || false,
          paymentUrl,
          watermarkText: watermarkText || null,
          eSignatureUrl: eSignatureUrl || null,
          client: {
            name: client.name,
            email: client.email,
            company: client.company,
            address: client.address,
          },
          items: invoice.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
          })),
        };
        
        console.log('🔧 Generating PDF...');
        const pdfUrl = await generateInvoicePDF(invoiceForPDF);
        console.log('✅ PDF generated successfully:', pdfUrl);
        
        // Update invoice with PDF URL
        console.log('💾 Updating invoice with PDF URL...');
        const updatedInvoice = await prisma.invoice.update({
          where: { id: invoice.id },
          data: { pdfUrl: typeof pdfUrl === 'string' ? pdfUrl : pdfUrl?.toString('base64') },
          include: {
            client: true,
            items: true,
          },
        });
        
        console.log('✅ Invoice updated with PDF URL');
        // Return the updated invoice with PDF URL
        return NextResponse.json(updatedInvoice, { status: 201 });
      } catch (pdfError) {
        console.error('❌ Error generating PDF:', pdfError);
        // Continue without PDF if generation fails - invoice is still created
        console.warn('⚠️  Invoice created successfully but PDF generation failed');
      }
    }

    console.log('✅ Invoice creation completed successfully');
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return NextResponse.json({ 
        error: 'Failed to create invoice', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: 'An unknown error occurred while creating the invoice'
    }, { status: 500 });
  }
}
