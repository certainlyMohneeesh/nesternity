import { Button } from '@/components/ui/button'

export function DownloadInvoiceButton({ pdfUrl }: { pdfUrl?: string }) {
  if (!pdfUrl) {
    return (
      <Button variant="outline" disabled>
        Not Generated
      </Button>
    )
  }

  return (
    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
      <Button variant="default">Download PDF</Button>
    </a>
  )
}
