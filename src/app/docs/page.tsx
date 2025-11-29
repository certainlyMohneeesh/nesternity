import React from 'react';

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Help & Documentation</h1>
        <p className="text-muted-foreground">Guides, FAQs, and documentation for using Nesternity.</p>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Getting Started</h3>
          <p className="text-sm text-muted-foreground">How to set up your account, create organisations and projects</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Billing & Subscriptions</h3>
          <p className="text-sm text-muted-foreground">How Razorpay billing works and account linking</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Integrations</h3>
          <p className="text-sm text-muted-foreground">How to setup payments, AI features, and other integrations</p>
        </div>
      </div>
    </div>
  )
}
