import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'Resend API key not configured',
        details: { configIssue: 'RESEND_API_KEY environment variable is missing' }
      }, { status: 500 });
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json({ 
        error: 'From email not configured',
        details: { configIssue: 'RESEND_FROM_EMAIL environment variable is missing' }
      }, { status: 500 });
    }

    const { to, subject, customHtml } = await request.json();

    if (!to || !subject || !customHtml) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: { required: ['to', 'subject', 'customHtml'] }
      }, { status: 400 });
    }

    // Send test email
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: `[TEST] ${subject}`,
      html: `
        <div style="border: 2px dashed #f59e0b; padding: 16px; margin-bottom: 16px; background: #fef3c7; border-radius: 8px;">
          <h3 style="color: #92400e; margin: 0 0 8px 0;">🧪 TEST EMAIL</h3>
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            This is a test email sent from the Nesternity admin panel at ${new Date().toLocaleString()}
          </p>
        </div>
        ${customHtml}
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          Sent via Nesternity Admin Panel | ${process.env.NEXT_PUBLIC_APP_URL}
        </p>
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        emailId: emailResult.data?.id,
        to,
        subject: `[TEST] ${subject}`,
        from: process.env.RESEND_FROM_EMAIL,
        timestamp: new Date().toISOString(),
        resendResponse: emailResult
      }
    });

  } catch (error: any) {
    console.error('Test email error:', error);
    
    return NextResponse.json({
      error: 'Failed to send test email',
      details: {
        message: error.message,
        name: error.name,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
