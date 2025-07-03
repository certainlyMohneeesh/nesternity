import React from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface DownloadInvoiceButtonProps {
  pdfUrl?: string | null
  invoiceNumber?: string
}

export function DownloadInvoiceButton({ 
  pdfUrl, 
  invoiceNumber 
}: DownloadInvoiceButtonProps) {
  const handleDownload = () => {
    if (pdfUrl) {
      // Create a temporary link to download the PDF
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `invoice-${invoiceNumber || 'document'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={!pdfUrl}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </Button>
  )
}
