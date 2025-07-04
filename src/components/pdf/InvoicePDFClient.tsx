'use client'

import React from 'react'
import { InvoiceDocument } from '@/components/pdf/InvoiceDocument'
import { Button } from '@/components/ui/button'
import { Download, Eye, Loader2 } from 'lucide-react'

// Dynamic imports for React PDF components (client-only)
const PDFDownloadLink = React.lazy(() => 
  import('@react-pdf/renderer').then(module => ({ default: module.PDFDownloadLink }))
)
const PDFViewer = React.lazy(() => 
  import('@react-pdf/renderer').then(module => ({ default: module.PDFViewer }))
)

// Dynamic import for PDF function
let pdfFunction: typeof import('@react-pdf/renderer').pdf | null = null
const loadPdfFunction = async () => {
  if (!pdfFunction) {
    const pdfModule = await import('@react-pdf/renderer')
    pdfFunction = pdfModule.pdf
  }
  return pdfFunction
}

interface InvoiceData {
  id: string
  invoiceNumber: string
  createdAt: Date | string
  dueDate: Date | string
  notes?: string | null
  taxRate: number | null
  discount: number | null
  currency: string
  enablePaymentLink?: boolean
  paymentUrl?: string | null
  watermarkText?: string | null
  eSignatureUrl?: string | null
  client: {
    name: string
    email: string
    company?: string | null
    address?: string | null
  }
  items: Array<{
    id?: string
    description: string
    quantity: number
    rate: number
    total: number
  }>
}

interface InvoicePDFClientProps {
  invoice: InvoiceData
  showPreview?: boolean
}

export function InvoicePDFClient({ invoice, showPreview = false }: InvoicePDFClientProps) {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(showPreview)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)
  const { downloadPDF, downloadClientPDF } = useInvoicePDF(invoice)

  // Ensure we're on the client side
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const handleServerDownload = async () => {
    setIsGenerating(true)
    try {
      await downloadPDF()
    } catch (error) {
      console.error('Server download failed:', error)
      // Fallback to client-side generation
      try {
        await downloadClientPDF()
      } catch (clientError) {
        console.error('Client download also failed:', clientError)
        alert('Failed to generate PDF. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClientDownload = async () => {
    setIsGenerating(true)
    try {
      await downloadClientPDF()
    } finally {
      setIsGenerating(false)
    }
  }

  // Don't render React PDF components on server side
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleServerDownload}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Download PDF (Server)'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClientDownload}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Download PDF (Client)'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {isPreviewOpen ? 'Hide Preview' : 'Preview PDF'}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Loading PDF components...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* PDF Controls */}
      <div className="flex gap-2 flex-wrap">
        {/* Server-side PDF Download (with fallback) */}
        <Button
          onClick={handleServerDownload}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Download PDF (Server)'}
        </Button>

        {/* Client-side PDF Download */}
        <Button
          variant="outline"
          onClick={handleClientDownload}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Download PDF (Client)'}
        </Button>

        {/* React PDF Download Link (native component) */}
        <React.Suspense fallback={
          <Button variant="secondary" disabled className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </Button>
        }>
          <PDFDownloadLink
            document={<InvoiceDocument invoice={invoice} />}
            fileName={`invoice-${invoice.invoiceNumber}.pdf`}
          >
            {({ loading }) => (
              <Button
                variant="secondary"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {loading ? 'Generating PDF...' : 'Download PDF (React)'}
              </Button>
            )}
          </PDFDownloadLink>
        </React.Suspense>

        {/* Preview Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          {isPreviewOpen ? 'Hide Preview' : 'Preview PDF'}
        </Button>
      </div>

      {/* PDF Preview */}
      {isPreviewOpen && (
        <div className="border rounded-lg overflow-hidden">
          <div className="h-[600px] w-full">
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading PDF preview...</span>
                </div>
              </div>
            }>
              <PDFViewer width="100%" height="100%">
                <InvoiceDocument invoice={invoice} />
              </PDFViewer>
            </React.Suspense>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for programmatic PDF generation in client components
export function useInvoicePDF(invoice: InvoiceData) {
  const downloadPDF = React.useCallback(async () => {
    try {
      // Use the server-side API for more reliable PDF generation
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      throw error
    }
  }, [invoice])

  // Generate React PDF directly in the browser (for preview/download)
  const generateClientPDF = React.useCallback(async (): Promise<Blob> => {
    try {
      console.log('🎨 Generating React PDF in browser...');
      const pdf = await loadPdfFunction();
      const pdfBlob = await pdf(<InvoiceDocument invoice={invoice} />).toBlob();
      console.log('✅ Client-side React PDF generated successfully');
      return pdfBlob;
    } catch (error) {
      console.error('❌ Client-side React PDF generation failed:', error);
      throw error;
    }
  }, [invoice])

  const downloadClientPDF = React.useCallback(async () => {
    try {
      const pdfBlob = await generateClientPDF();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading client PDF:', error);
      throw error;
    }
  }, [invoice, generateClientPDF]);

  return { 
    downloadPDF, 
    downloadClientPDF, 
    generateClientPDF 
  }
}

// Helper function to get auth token (implement based on your auth system)
async function getAuthToken(): Promise<string> {
  // This should get the current user's auth token
  // Implementation depends on your auth system (Supabase, Auth0, etc.)
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('No authentication token available')
  }
  
  return session.access_token
}
