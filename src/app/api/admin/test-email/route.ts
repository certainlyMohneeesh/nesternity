import { NextRequest, NextResponse } from 'next/server';
import { SendMailClient } from 'zeptomail';

// ZeptoMail Configuration
const ZEPTOMAIL_URL: string = process.env.ZEPTOMAIL_URL || 'https://api.zeptomail.in/v1.1/email';
const ZEPTOMAIL_TOKEN: string = process.env.ZEPTOMAIL_TOKEN || '';
const FROM_EMAIL: string = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@cyth.dev';
const FROM_NAME: string = process.env.ZEPTOMAIL_FROM_NAME || 'Nesternity';

// Initialize ZeptoMail client
let zeptoClient: SendMailClient | null = null;

function getZeptoClient(): SendMailClient {
  if (!zeptoClient) {
    if (!ZEPTOMAIL_TOKEN) {
      throw new Error('ZEPTOMAIL_TOKEN is not configured');
    }
    zeptoClient = new SendMailClient({ url: ZEPTOMAIL_URL, token: ZEPTOMAIL_TOKEN });
  }
  return zeptoClient;
}

export async function POST(request: NextRequest) {
  try {
    if (!ZEPTOMAIL_TOKEN) {
      return NextResponse.json({ 
        error: 'ZeptoMail API key not configured',
        details: { configIssue: 'ZEPTOMAIL_TOKEN environment variable is missing' }
      }, { status: 500 });
    }

    const { to, subject, customHtml } = await request.json();

    if (!to || !subject || !customHtml) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: { required: ['to', 'subject', 'customHtml'] }
      }, { status: 400 });
    }

    // Send test email via ZeptoMail
    const zeptoClient = getZeptoClient();
    const emailResult = await zeptoClient.sendMail({
      from: {
        address: FROM_EMAIL,
        name: FROM_NAME,
      },
      to: [
        {
          email_address: {
            address: to,
            name: to,
          },
        },
      ],
      subject: `[TEST] ${subject}`,
      htmlbody: `
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
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        emailId: emailResult?.request_id,
        to,
        subject: `[TEST] ${subject}`,
        from: FROM_EMAIL,
        timestamp: new Date().toISOString(),
        zeptoResponse: emailResult
      }
    });

  } catch (error: unknown) {
    console.error('Test email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Error';
    
    return NextResponse.json({
      error: 'Failed to send test email',
      details: {
        message: errorMessage,
        name: errorName,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
