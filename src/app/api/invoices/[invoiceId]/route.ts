import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
        issuedById: user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            address: true,
            phone: true,
          },
        },
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
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

    const body = await req.json();
    const { status, notes } = body;

    const invoice = await prisma.invoice.updateMany({
      where: {
        id: resolvedParams.id,
        issuedById: user.id,
      },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    if (invoice.count === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: resolvedParams.id },
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ Invoice delete request received');
    const resolvedParams = await params;
    
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
    console.log('🔍 Looking for invoice:', resolvedParams.id);

    // Check if invoice exists and belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
        issuedById: user.id,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      console.error('❌ Invoice not found or access denied');
      return NextResponse.json({ error: 'Invoice not found or access denied' }, { status: 404 });
    }

    console.log('✅ Invoice found:', invoice.invoiceNumber);

    // Delete invoice items first (cascade should handle this, but being explicit)
    console.log('🗑️ Deleting invoice items...');
    await prisma.invoiceItem.deleteMany({
      where: {
        invoiceId: resolvedParams.id,
      },
    });
    console.log('✅ Invoice items deleted');

    // Delete the invoice
    console.log('🗑️ Deleting invoice...');
    await prisma.invoice.delete({
      where: {
        id: resolvedParams.id,
      },
    });

    console.log('✅ Invoice deleted successfully:', invoice.invoiceNumber);

    // Revalidate invoices page to update the list
    revalidatePath('/dashboard/invoices');

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} deleted successfully`,
    });
  } catch (error) {
    console.error('❌ Error deleting invoice:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ 
      error: 'Failed to delete invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
