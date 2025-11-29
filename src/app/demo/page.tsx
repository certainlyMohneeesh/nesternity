import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Receipt, Eye } from 'lucide-react'

export default function DemoIndexPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">PDF Demo Previews</h1>
                    <p className="text-muted-foreground">
                        Test and preview professional PDF documents before sending to clients
                    </p>
                </div>

                {/* Demo Cards */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    {/* Invoice Demo */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Receipt className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>Invoice PDF Demo</CardTitle>
                                    <CardDescription>Preview professional invoice design</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Test the invoice PDF layout with sample data including tax calculations,
                                discounts, payment links, and watermarks.
                            </p>
                            <Link href="/demo/invoice">
                                <Button className="w-full">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Invoice Demo
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Proposal Demo */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <FileText className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle>Proposal PDF Demo</CardTitle>
                                    <CardDescription>Preview professional proposal design</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Test the proposal PDF layout with sample deliverables, timeline phases,
                                investment details, and signature sections.
                            </p>
                            <Link href="/demo/proposal">
                                <Button className="w-full">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Proposal Demo
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Features */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>✨ Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold mb-2">📄 Live PDF Preview</h3>
                                <p className="text-sm text-muted-foreground">
                                    See exactly how your PDFs will look before generating them
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">⬇️ Quick Download</h3>
                                <p className="text-sm text-muted-foreground">
                                    Download demo PDFs instantly to test in different viewers
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">🎨 Professional Design</h3>
                                <p className="text-sm text-muted-foreground">
                                    Airbnb-inspired layouts with modern styling and branding
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">🔧 Developer Friendly</h3>
                                <p className="text-sm text-muted-foreground">
                                    Sample data you can easily modify for different test scenarios
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>🚀 Quick Start</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li>Click on either Invoice or Proposal demo above</li>
                            <li>Click "Show Preview" to see the live PDF</li>
                            <li>Click "Download Demo PDF" to save the PDF locally</li>
                            <li>Verify the logo appears correctly (update LOGO_URL in components if needed)</li>
                            <li>Test different scenarios by modifying the sample data in the demo pages</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
