import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    console.log('📄 PDF download request for invoice:', resolvedParams.id)
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoiceId = resolvedParams.id

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        OR: [
          // Direct ownership
          { issuedById: user.id },
          // Access through team membership
          {
            client: {
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
          }
        ]
      },
      include: {
        client: true,
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found or access denied' }, { status: 404 })
    }

    console.log('✅ Invoice found, generating PDF...')

    // Transform the data to match our component interface
    const invoiceData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      taxRate: invoice.taxRate,
      discount: invoice.discount,
      currency: invoice.currency,
      client: {
        name: invoice.client.name,
        email: invoice.client.email,
        company: invoice.client.company,
        address: invoice.client.address,
      },
      items: invoice.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        total: item.total,
      })),
    }

    // Generate PDF buffer (don't upload, just return for download)
    const { generateInvoicePDF } = await import('@/lib/generatePdf')
    const pdfBuffer = await generateInvoicePDF(invoiceData, { 
      upload: false, 
      returnBuffer: true 
    }) as Buffer

    console.log('✅ PDF generated, sending as download...')

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('❌ Error generating PDF for download:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
