import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function uploadInvoicePDF(buffer: Buffer, filename: string) {
  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(`pdf/${filename}`, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) throw new Error(error.message)

  const { data: publicUrl } = supabase.storage
    .from('invoices')
    .getPublicUrl(`pdf/${filename}`)

  return publicUrl.publicUrl
}
