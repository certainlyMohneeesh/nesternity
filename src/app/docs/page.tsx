import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FolderKanban, Users, FileText, CreditCard, Zap, HelpCircle } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Help & Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about using Nesternity for your project management needs.
        </p>
      </div>

      {/* Quick Start Guide */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Create an Organisation</CardTitle>
                  <CardDescription>Set up your workspace</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Organisations are the top-level containers for your work. Create one for your company or team.
              </p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Click on your profile menu</li>
                <li>Select "Create Organisation"</li>
                <li>Enter organisation name and details</li>
                <li>Click "Create" to set up your workspace</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FolderKanban className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Create a Project</CardTitle>
                  <CardDescription>Start managing your work</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Projects help you organize and track specific initiatives within your organisation.
              </p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Navigate to your organisation</li>
                <li>Click "New Project"</li>
                <li>Fill in project details</li>
                <li>Invite team members to collaborate</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Manage Proposals & Invoices</CardTitle>
                  <CardDescription>Handle your documents</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Create professional proposals and invoices directly from your projects.
              </p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Open a project</li>
                <li>Go to Proposals or Invoices tab</li>
                <li>Click "Create New"</li>
                <li>Fill in details and generate PDF</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Team Collaboration</CardTitle>
                  <CardDescription>Work together effectively</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Invite team members and manage permissions for seamless collaboration.
              </p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Navigate to project settings</li>
                <li>Go to "Team" section</li>
                <li>Click "Invite Member"</li>
                <li>Set appropriate permissions</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Key Features</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  AI-Powered Assistance
                </h3>
                <p className="text-sm text-muted-foreground">
                  Leverage AI to generate project plans, estimate budgets, and create professional documents automatically.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Professional PDFs
                </h3>
                <p className="text-sm text-muted-foreground">
                  Generate beautiful proposals and invoices with your branding, ready to send to clients.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Integrated Payments
                </h3>
                <p className="text-sm text-muted-foreground">
                  Accept payments through Razorpay with seamless integration and automated invoice tracking.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Collaborate with your team, assign roles, and manage permissions across projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Billing & Payments */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Billing & Subscriptions</h2>
        <Card>
          <CardHeader>
            <CardTitle>How Billing Works</CardTitle>
            <CardDescription>Understanding your Nesternity subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Razorpay Integration</h4>
              <p className="text-sm text-muted-foreground">
                Nesternity uses Razorpay for secure and reliable payment processing. You can link your Razorpay account
                to accept payments directly through invoices.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Subscription Plans</h4>
              <p className="text-sm text-muted-foreground">
                Choose from flexible plans based on your team size and features needed. Upgrade or downgrade anytime
                from your settings page.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Payment Security</h4>
              <p className="text-sm text-muted-foreground">
                All payment data is securely processed through Razorpay. We never store your card details on our servers.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQs */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                How do I invite team members?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Navigate to your project, go to the Team section, and click "Invite Member". Enter their email address
                and set their role (Admin, Member, or Viewer). They'll receive an invitation email to join your project.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Can I customize my invoices and proposals?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Yes! You can customize your PDFs with your company logo, colors, and branding. Upload your logo in the
                organisation settings, and it will automatically appear on all generated documents.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                How does the AI assistant work?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our AI assistant helps you with project planning, budget estimation, and document generation. It analyzes
                your project details and provides intelligent suggestions. Simply describe what you need, and the AI will
                help create structured plans and estimates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                What payment methods are supported?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Through Razorpay integration, we support credit/debit cards, UPI, net banking, and wallets. Your clients
                can pay invoices using any of these methods when they click the payment link.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Can I export my data?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Yes, you can export all your data from the Settings → Data Management section. Click "Export Data" to
                download a JSON file containing all your organisations, projects, proposals, and invoices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                How do I delete my account?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                To delete your account, go to Settings → Data Management → Delete Account. For security, you'll need to
                type "delete" to confirm. Note that this action is permanent and will remove all your data.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support */}
      <section>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
            <CardDescription>We're here to assist you</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              If you couldn't find the answer you're looking for, please don't hesitate to reach out to our support team.
            </p>
            <div className="flex gap-4">
              <a
                href="mailto:support@nesternity.com"
                className="text-sm font-medium text-primary hover:underline"
              >
                Email Support
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="https://github.com/nesternity/nesternity"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                GitHub Discussions
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
