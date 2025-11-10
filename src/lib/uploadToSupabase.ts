import { createSupabaseServerClient } from '@/lib/supabase'

export async function uploadInvoicePDF(
  pdfBuffer: Buffer, 
  filename: string,
  options: { contentType?: string; isHTML?: boolean } = {}
): Promise<string> {
  const { contentType = 'application/pdf', isHTML = false } = options
  
  try {
    console.log('☁️  Starting invoice PDF upload to Supabase storage:', filename);
    console.log('📦 Buffer size:', pdfBuffer.length, 'bytes');
    console.log('📝 Content type:', contentType);
    
    // Use server client with service role to bypass RLS
    const supabase = createSupabaseServerClient()
    
    // Adjust filename based on content type
    const actualFilename = isHTML && !filename.endsWith('.html') 
      ? filename.replace('.pdf', '.html')
      : filename
    
    // Determine the upload path based on content type
    const uploadPath = isHTML ? `html/${actualFilename}` : `pdfs/${actualFilename}`
    
    console.log('📤 Uploading invoice file to storage: invoices/' + uploadPath);
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(uploadPath, pdfBuffer, {
        contentType,
        upsert: true
      })

    if (error) {
      console.error('❌ Error uploading invoice file:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        statusCode: (error as any).statusCode,
      });
      throw new Error(`Failed to upload invoice file to storage: ${error.message}`)
    }

    console.log('✅ Invoice file uploaded successfully:', data?.path);

    // Get the public URL for the uploaded file
    console.log('🔗 Getting public URL for invoice...');
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(uploadPath)

    console.log('✅ Public URL generated for invoice:', publicUrl);
    return publicUrl
  } catch (error) {
    console.error('❌ Error in uploadInvoicePDF:', error);
    console.error('Full error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error
  }
}

// Helper function to upload different types of invoice files
export async function uploadInvoiceFile(
  buffer: Buffer,
  filename: string,
  type: 'pdf' | 'html' | 'json' = 'pdf'
): Promise<string> {
  const contentTypeMap = {
    pdf: 'application/pdf',
    html: 'text/html',
    json: 'application/json'
  }
  
  const isHTML = type === 'html'
  const contentType = contentTypeMap[type]
  
  return uploadInvoicePDF(buffer, filename, { contentType, isHTML })
}

// Upload proposal PDF to Supabase storage
export async function uploadProposalPDF(
  pdfBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    console.log('☁️  Starting proposal PDF upload to Supabase storage:', filename)

    // Use server client with service role to bypass RLS
    const supabase = createSupabaseServerClient()

    const uploadPath = `pdfs/${filename}`
    console.log('📤 Uploading proposal PDF to storage:', uploadPath)

    const { data, error } = await supabase.storage
      .from('proposals')
      .upload(uploadPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (error) {
      console.error('❌ Error uploading proposal PDF:', error)
      throw new Error(`Failed to upload proposal PDF: ${error.message}`)
    }

    console.log('✅ Proposal PDF uploaded successfully:', data?.path)

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('proposals')
      .getPublicUrl(uploadPath)

    console.log('✅ Public URL generated:', publicUrl)
    return publicUrl
  } catch (error) {
    console.error('❌ Error in uploadProposalPDF:', error)
    throw error
  }
}
