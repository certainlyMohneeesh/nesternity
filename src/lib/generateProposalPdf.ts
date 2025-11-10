import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { ProposalDocument } from '@/components/pdf/ProposalDocument'

interface ProposalData {
  id: string
  title: string
  createdAt: Date
  pricing: number
  currency: string
  paymentTerms?: string | null
  brief: string
  deliverables: any
  timeline: any
  client: {
    name: string
    email: string
    company?: string | null
    address?: string | null
    phone?: string | null
  }
  project?: {
    name: string
    description?: string | null
  } | null
  signatures?: Array<{
    signerName: string
    signerEmail: string
    signerTitle?: string | null
    signatureBlob: string
    signedAt: Date
  }>
}

export async function generateProposalPDF(
  proposal: ProposalData,
  options: { upload?: boolean; returnBuffer?: boolean } = {}
): Promise<string | Buffer> {
  const { upload = true, returnBuffer = false } = options

  try {
    console.log('📄 Starting React PDF generation for proposal:', proposal.title)

    // Generate PDF using React PDF
    console.log('🎨 Generating React PDF...')
    const reactBuffer = await generateReactProposalPDF(proposal)

    console.log('✅ React PDF generated successfully, size:', reactBuffer.length, 'bytes')

    if (returnBuffer) {
      console.log('✅ React PDF generated successfully (buffer returned)')
      return reactBuffer
    }

    if (upload) {
      const filename = `proposal-${proposal.id}.pdf`
      console.log('☁️  Uploading React PDF to storage:', filename)
      const { uploadProposalPDF } = await import('@/lib/uploadToSupabase')
      const pdfUrl = await uploadProposalPDF(reactBuffer, filename)
      console.log('✅ React PDF uploaded successfully:', pdfUrl)
      return pdfUrl
    }

    return reactBuffer
  } catch (error) {
    console.error('❌ React PDF generation failed:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function generateReactProposalPDF(proposal: ProposalData): Promise<Buffer> {
  console.log('🎨 Starting React PDF generation...')

  try {
    // Create the proposal document using React.createElement with type assertion
    const proposalElement = React.createElement(ProposalDocument, { proposal })
    const pdfBlob = await pdf(proposalElement as React.ReactElement<any>).toBlob()
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    console.log('✅ React PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    return pdfBuffer
  } catch (error) {
    console.error('❌ React PDF generation failed:', error)
    throw error
  }
}
