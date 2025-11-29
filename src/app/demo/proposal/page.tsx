'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { ProposalDocument } from '@/components/pdf/ProposalDocument'
import { Download, Eye } from 'lucide-react'

// Force dynamic rendering to avoid SSR issues with PDFDownloadLink
export const dynamic = 'force-dynamic'

// Sample proposal data for demo
const sampleProposal = {
    id: 'demo-proposal-001',
    title: 'ConvNeXt Model for Crop Disease Prediction and Analysis',
    createdAt: new Date('2025-11-29'),
    pricing: 450000,
    currency: 'INR',
    paymentTerms: '30% upfront (INR 135,000), 30% after Milestone 2 (INR 135,000), 20% after Milestone 3 (INR 90,000), 20% on completion (INR 90,000)',
    brief: 'A ConvNeXt model to predict and analyse the crop disease. This comprehensive solution will leverage state-of-the-art deep learning architecture to provide accurate disease detection and actionable insights for agricultural stakeholders.',
    deliverables: [
        {
            item: 'Dataset Preparation',
            description: 'Acquire, clean, and preprocess crop disease dataset including augmentation for robust training.',
            timeline: '1 week'
        },
        {
            item: 'ConvNeXt Model Implementation',
            description: 'Develop and customize ConvNeXt architecture using PyTorch for crop disease classification.',
            timeline: '1 week'
        },
        {
            item: 'Model Training and Optimization',
            description: 'Train model on GPU, hyperparameter tuning, and apply techniques like transfer learning.',
            timeline: '1 week'
        },
        {
            item: 'Evaluation and Metrics',
            description: 'Comprehensive testing with accuracy, F1-score, confusion matrix, and cross-validation.',
            timeline: '8-4 days'
        },
        {
            item: 'Prediction Interface',
            description: 'Build user-friendly script/app for image upload, prediction, and disease analysis report.',
            timeline: '8-4 days'
        },
        {
            item: 'Documentation and Deployment',
            description: 'Full model docs, usage guide, Docker container for easy deployment.',
            timeline: '2-3 days'
        }
    ],
    timeline: [
        {
            name: 'Phase 1: Research & Preparation',
            duration: '1 week',
            deliverables: [
                'Dataset collection and preprocessing',
                'Model architecture finalization',
                'Development environment setup'
            ]
        },
        {
            name: 'Phase 2: Model Development',
            duration: '2 weeks',
            deliverables: [
                'ConvNeXt model implementation',
                'Training pipeline setup',
                'Initial model training'
            ]
        },
        {
            name: 'Phase 3: Optimization & Testing',
            duration: '1.5 weeks',
            deliverables: [
                'Hyperparameter tuning',
                'Performance optimization',
                'Comprehensive testing and validation'
            ]
        },
        {
            name: 'Phase 4: Deployment & Documentation',
            duration: '1 week',
            deliverables: [
                'User interface development',
                'Deployment setup',
                'Complete documentation'
            ]
        }
    ],
    client: {
        name: 'Mohneesh Naidu',
        email: 'certainlymohneesh@gmail.com',
        company: 'Mohneesh Naidu\'s Organisation',
        address: '123 Tech Street, Innovation District, Bangalore, Karnataka 560001',
        phone: '+91 98765 43210'
    },
    project: {
        name: 'Crop Disease Detection AI System',
        description: 'Development of an advanced machine learning system for automated crop disease detection and analysis using ConvNeXt architecture.'
    },
    signatures: [
        {
            signerName: 'John Doe',
            signerEmail: 'john@nesternity.com',
            signerTitle: 'Project Manager',
            signatureBlob: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            signedAt: new Date('2025-11-29')
        }
    ]
}

export default function DemoProposalPage() {
    const [showPreview, setShowPreview] = React.useState(false)
    const [isClient, setIsClient] = React.useState(false)

    React.useEffect(() => {
        setIsClient(true)
    }, [])

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-6 w-6" />
                            Proposal PDF Demo Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            This is a demo page to preview the professional proposal PDF design.
                            Use this to test the PDF layout, styling, and ensure everything looks perfect before sending to clients.
                        </p>
                        <div className="flex gap-4">
                            <Button
                                onClick={() => setShowPreview(!showPreview)}
                                variant={showPreview ? "secondary" : "default"}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </Button>
                            {isClient && (
                                <PDFDownloadLink
                                    document={<ProposalDocument proposal={sampleProposal} />}
                                    fileName="demo-proposal.pdf"
                                >
                                    {({ loading }) => (
                                        <Button variant="outline" disabled={loading}>
                                            <Download className="h-4 w-4 mr-2" />
                                            {loading ? 'Generating PDF...' : 'Download Demo PDF'}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sample Data Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sample Proposal Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold">Title:</p>
                                <p className="text-muted-foreground">{sampleProposal.title}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Client:</p>
                                <p className="text-muted-foreground">{sampleProposal.client.name}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Investment:</p>
                                <p className="text-muted-foreground">₹{sampleProposal.pricing.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Deliverables:</p>
                                <p className="text-muted-foreground">{sampleProposal.deliverables.length} items</p>
                            </div>
                            <div>
                                <p className="font-semibold">Timeline Phases:</p>
                                <p className="text-muted-foreground">{sampleProposal.timeline.length} phases</p>
                            </div>
                            <div>
                                <p className="font-semibold">Date:</p>
                                <p className="text-muted-foreground">{sampleProposal.createdAt.toLocaleDateString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PDF Preview */}
                {showPreview && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Live PDF Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden" style={{ height: '800px' }}>
                                {typeof window !== 'undefined' && (
                                    <PDFViewer width="100%" height="100%" showToolbar={true}>
                                        <ProposalDocument proposal={sampleProposal} />
                                    </PDFViewer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Developer Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <p>
                                <strong>📝 Purpose:</strong> This demo page helps you preview and test the proposal PDF design without creating actual proposals.
                            </p>
                            <p>
                                <strong>🎨 Customization:</strong> Edit the sample data above to test different scenarios, client names, pricing formats, etc.
                            </p>
                            <p>
                                <strong>🖼️ Logo:</strong> Make sure to update the LOGO_URL in <code className="bg-muted px-1 py-0.5 rounded">ProposalDocument.tsx</code> with your Cloudflare CDN URL.
                            </p>
                            <p>
                                <strong>💡 Access:</strong> Visit this page at <code className="bg-muted px-1 py-0.5 rounded">/demo/proposal</code> anytime during development.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
