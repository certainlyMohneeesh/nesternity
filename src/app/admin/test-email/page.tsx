'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Copy,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function TestEmailPage() {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: 'Test Email from Nesternity',
    template: 'custom',
    customHtml: `<h1>Test Email</h1>
<p>This is a test email from your Nesternity application.</p>
<p>If you received this, your email service is working correctly!</p>
<p>Sent at: ${new Date().toLocaleString()}</p>`
  });
  
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const emailTemplates = {
    custom: 'Custom HTML',
    invite: 'Team Invitation',
    welcome: 'Welcome Email',
    test: 'Simple Test'
  };

  const presetTemplates = {
    invite: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #3b82f6;">Team Invitation</h2>
  <p>You've been invited to join <strong>Test Team</strong>.</p>
  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Accept Invitation
    </a>
  </div>
  <p>This invitation expires in 7 days.</p>
</div>`,
    welcome: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #059669;">Welcome to Nesternity!</h1>
  <p>Thank you for joining our platform. We're excited to have you on board!</p>
  <p>You can now:</p>
  <ul>
    <li>Create and manage teams</li>
    <li>Invite team members</li>
    <li>Track activities and progress</li>
  </ul>
  <p>Get started by visiting your dashboard.</p>
</div>`,
    test: `<h1>Email Test</h1>
<p>This is a simple test email.</p>
<p>Timestamp: ${new Date().toISOString()}</p>`
  };

  async function handleSendEmail() {
    if (!emailData.to || !emailData.subject) {
      setResult({
        success: false,
        message: 'Please fill in recipient email and subject'
      });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: 'Email sent successfully!',
          details: data.details
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send email',
          details: data.details
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Network error: ' + error.message
      });
    } finally {
      setSending(false);
    }
  }

  function handleTemplateChange(template: string) {
    setEmailData(prev => ({
      ...prev,
      template,
      customHtml: presetTemplates[template as keyof typeof presetTemplates] || prev.customHtml
    }));
  }

  function copyTemplate() {
    navigator.clipboard.writeText(emailData.customHtml);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Testing</h1>
            <p className="text-gray-600 mt-2">Test email delivery and templates</p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Test Email
              </CardTitle>
              <CardDescription>
                Send a test email to verify your email service configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="to">Recipient Email</Label>
                <Input
                  id="to"
                  type="email"
                  placeholder="test@example.com"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="template">Template</Label>
                <Select value={emailData.template} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(emailTemplates).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="html">HTML Content</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyTemplate}
                    className="h-8 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Textarea
                  id="html"
                  placeholder="Email HTML content"
                  value={emailData.customHtml}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailData(prev => ({ ...prev, customHtml: e.target.value }))}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <Button 
                onClick={handleSendEmail} 
                disabled={sending || !emailData.to || !emailData.subject}
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result & Preview */}
          <div className="space-y-6">
            {/* Result */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Test Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-4 rounded-lg ${
                    result.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm opacity-75">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-black/5 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* HTML Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>
                  Preview how your email will look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white min-h-[200px]">
                  <div dangerouslySetInnerHTML={{ __html: emailData.customHtml }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
