import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { InvoiceDocument } from '@/components/pdf/InvoiceDocument'

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  client: {
    name: string;
    email: string;
    company?: string | null;
    address?: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    total: number;
  }>;
  taxRate: number | null;
  discount: number | null;
  currency: string;
  dueDate: Date;
  createdAt: Date;
  notes?: string | null;
  // Optional watermark and signature fields
  watermarkText?: string | null;
  eSignatureUrl?: string | null;
  // Payment link options
  enablePaymentLink?: boolean;
  paymentUrl?: string | null;
}

export async function generateInvoicePDF(
  invoice: InvoiceData, 
  options: { upload?: boolean; returnBuffer?: boolean } = {}
): Promise<string | Buffer> {
  const { upload = true, returnBuffer = false } = options;
  
  try {
    console.log('📄 Starting React PDF generation for invoice:', invoice.invoiceNumber);
    
    // Use React PDF only (optimized for smaller file size)
    console.log('🎨 Generating React PDF...');
    const reactBuffer = await generateReactPDF(invoice);
    
    console.log('✅ React PDF generated successfully, size:', reactBuffer.length, 'bytes');
    
    if (returnBuffer) {
      console.log('✅ React PDF generated successfully (buffer returned)');
      return reactBuffer;
    }
    
    if (upload) {
      const filename = `invoice-${invoice.invoiceNumber}.pdf`;
      console.log('☁️  Uploading React PDF to storage:', filename);
      const { uploadInvoicePDF } = await import('@/lib/uploadToSupabase');
      const pdfUrl = await uploadInvoicePDF(reactBuffer, filename);
      console.log('✅ React PDF uploaded successfully:', pdfUrl);
      return pdfUrl;
    }
    
    return reactBuffer;
  } catch (error) {
    console.error('❌ React PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateReactPDF(invoice: InvoiceData): Promise<Buffer> {
  console.log('🎨 Starting React PDF generation...');
  
  try {
    // Create the invoice document using React.createElement with type assertion
    const invoiceElement = React.createElement(InvoiceDocument, { invoice });
    const pdfBlob = await pdf(invoiceElement as React.ReactElement<any>).toBlob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    console.log('✅ React PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    return pdfBuffer;
  } catch (error) {
    console.error('❌ React PDF generation failed:', error);
    throw error;
  }
}