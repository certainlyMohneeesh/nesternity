import { supabase } from '@/lib/supabase'

export async function uploadInvoicePDF(
  pdfBuffer: Buffer, 
  filename: string
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(`pdfs/${filename}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (error) {
      console.error('Error uploading PDF:', error)
      throw new Error('Failed to upload PDF to storage')
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(`pdfs/${filename}`)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadInvoicePDF:', error)
    throw error
  }
}
