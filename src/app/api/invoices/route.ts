import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSafeUser } from '@/lib/safe-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSafeUser();
    if (!user) {
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
    const user = await getSafeUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
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
    } = body;

    if (!invoiceNumber || !clientId || !dueDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Invoice number, client, due date, and items are required' },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        createdBy: user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * ((taxRate || 0) / 100);
    const discountAmount = subtotal * ((discount || 0) / 100);
    const total = subtotal + taxAmount - discountAmount;

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
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.quantity * item.rate,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
