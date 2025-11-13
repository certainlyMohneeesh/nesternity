import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
        issuedById: user.id,
      },
      include: {
        client: true,
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    // Calculate total amount
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (invoice.taxRate || 0) / 100
    const discountAmount = subtotal * (invoice.discount || 0) / 100
    const finalTotal = subtotal + taxAmount - discountAmount

    // Create line items for Stripe (without discount as line item)
    const lineItems = invoice.items.map(item => ({
      price_data: {
        currency: invoice.currency.toLowerCase(),
        product_data: {
          name: item.description,
        },
        unit_amount: Math.round(item.rate * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    // Add tax as a separate line item if applicable
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: {
            name: `Tax (${invoice.taxRate}%)`,
          },
          unit_amount: Math.round(taxAmount * 100),
        },
        quantity: 1,
      })
    }

    // Prepare discount coupon if applicable
    let discounts = undefined
    if (discountAmount > 0) {
      // Create a one-time coupon for this session
      const coupon = await stripe.coupons.create({
        percent_off: invoice.discount,
        duration: 'once',
        name: `Discount (${invoice.discount}%)`,
      })
      
      discounts = [{
        coupon: coupon.id
      }]
    }

    // Create Stripe checkout session
    const sessionData: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/dashboard/invoices/${resolvedParams.id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/dashboard/invoices/${resolvedParams.id}?payment=cancelled`,
      metadata: {
        invoiceId: invoice.id,
        userId: user.id,
      },
      customer_email: invoice.client.email,
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
    }

    // Add discounts if applicable
    if (discounts) {
      sessionData.discounts = discounts
    }

    const session = await stripe.checkout.sessions.create(sessionData)

    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
