import { createSupabaseServerClient } from '@/lib/supabase'

export async function uploadInvoicePDF(
  pdfBuffer: Buffer, 
  filename: string,
  options: { contentType?: string; isHTML?: boolean } = {}
): Promise<string> {
  const { contentType = 'application/pdf', isHTML = false } = options
  
  try {
    console.log('☁️  Starting PDF upload to Supabase storage:', filename);
    
    // Use server client with service role to bypass RLS
    const supabase = createSupabaseServerClient()
    
    // Adjust filename based on content type
    const actualFilename = isHTML && !filename.endsWith('.html') 
      ? filename.replace('.pdf', '.html')
      : filename
    
    // First, check if the bucket exists, if not create it
    console.log('🔍 Checking if invoices bucket exists...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
    } else {
      console.log('📋 Available buckets:', buckets?.map(b => b.name).join(', '));
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'invoices')
    console.log('📦 Bucket exists:', bucketExists);
    
    if (!bucketExists) {
      // Try to create the bucket
      console.log('🏗️  Creating invoices bucket...');
      const { error: createError } = await supabase.storage.createBucket('invoices', {
        public: true,
        allowedMimeTypes: ['application/pdf', 'text/html'],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError)
        console.warn('⚠️  Continuing anyway - bucket might exist but not be listable');
      } else {
        console.log('✅ Bucket created successfully');
      }
    }

    // Determine the upload path based on content type
    const uploadPath = isHTML ? `html/${actualFilename}` : `pdfs/${actualFilename}`
    
    console.log('📤 Uploading file to storage:', uploadPath);
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(uploadPath, pdfBuffer, {
        contentType,
        upsert: true
      })

    if (error) {
      console.error('❌ Error uploading file:', error)
      throw new Error(`Failed to upload file to storage: ${error.message}`)
    }

    console.log('✅ File uploaded successfully:', data?.path);

    // Get the public URL for the uploaded file
    console.log('🔗 Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(uploadPath)

    console.log('✅ Public URL generated:', publicUrl);
    return publicUrl
  } catch (error) {
    console.error('❌ Error in uploadInvoicePDF:', error)
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
