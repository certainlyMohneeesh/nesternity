import { NextRequest, NextResponse } from 'next/server';
import { SendMailClient } from 'zeptomail';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`\n[Budget Warning Email] ========== REQUEST START [${requestId}] ==========`);
  console.log('[Budget Warning Email] Timestamp:', new Date().toISOString());
  
  try {
    // 1. Authenticate user
    console.log('[Budget Warning Email] Step 1: Authenticating user...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Budget Warning Email] ❌ Authentication failed:', {
        error: authError?.message,
        hasUser: !!user,
        requestId,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Budget Warning Email] ✅ User authenticated:', {
      userId: user.id,
      email: user.email,
      requestId,
    });

    // 2. Parse request body
    console.log('[Budget Warning Email] Step 2: Parsing request body...');
    const body = await req.json();
    const { clientId, subject, htmlContent, senderName, senderTitle, senderCompany } = body;

    console.log('[Budget Warning Email] Request payload:', {
      clientId,
      subject: subject?.substring(0, 50) + '...',
      htmlContentLength: htmlContent?.length || 0,
      senderName,
      senderTitle,
      senderCompany,
      requestId,
    });

    // 3. Validate required fields
    if (!clientId || !subject || !htmlContent) {
      console.error('[Budget Warning Email] ❌ Missing required fields:', {
        hasClientId: !!clientId,
        hasSubject: !!subject,
        hasHtmlContent: !!htmlContent,
        requestId,
      });
      return NextResponse.json(
        { error: 'Missing required fields: clientId, subject, htmlContent' },
        { status: 400 }
      );
    }

    // 4. Fetch client details
    console.log('[Budget Warning Email] Step 3: Fetching client details...');
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        createdBy: true,
      },
    });

    if (!client) {
      console.error('[Budget Warning Email] ❌ Client not found:', {
        clientId,
        requestId,
      });
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // 5. Verify user has access to this client
    if (client.createdBy !== user.id) {
      console.error('[Budget Warning Email] ❌ Access denied:', {
        clientCreatedBy: client.createdBy,
        requestingUserId: user.id,
        requestId,
      });
      return NextResponse.json(
        { error: 'Access denied to this client' },
        { status: 403 }
      );
    }

    console.log('[Budget Warning Email] ✅ Client details fetched:', {
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientCompany: client.company,
      requestId,
    });

    // 6. Prepare email HTML with signature
    console.log('[Budget Warning Email] Step 4: Preparing email HTML...');
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
          }
          .signature-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
          }
          .signature-title {
            color: #666;
            margin-bottom: 2px;
          }
          .signature-company {
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          ${htmlContent}
          
          <div class="signature">
            <div class="signature-name">${senderName || user.email?.split('@')[0] || 'Project Manager'}</div>
            <div class="signature-title">${senderTitle || 'Project Manager'}</div>
            <div class="signature-company">${senderCompany || 'Nesternity'}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('[Budget Warning Email] Email HTML prepared:', {
      totalLength: emailHtml.length,
      hasSignature: true,
      requestId,
    });

    // 7. Check ZeptoMail configuration
    if (!ZEPTOMAIL_TOKEN) {
      console.error('[Budget Warning Email] ❌ ZEPTOMAIL_TOKEN not configured', {
        requestId,
      });
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    console.log('[Budget Warning Email] Email service configuration:', {
      fromEmail: FROM_EMAIL,
      fromName: FROM_NAME,
      hasToken: !!ZEPTOMAIL_TOKEN,
      requestId,
    });

    // 8. Send email via ZeptoMail
    console.log('[Budget Warning Email] Step 5: Sending email via ZeptoMail...');
    const sendStartTime = Date.now();
    
    try {
      const zeptoClient = getZeptoClient();
      const emailResult = await zeptoClient.sendMail({
        from: {
          address: FROM_EMAIL,
          name: FROM_NAME,
        },
        to: [
          {
            email_address: {
              address: client.email,
              name: client.name || client.email,
            },
          },
        ],
        subject: subject,
        htmlbody: emailHtml,
        reply_to: user.email ? [{ address: user.email, name: user.email }] : undefined,
      });

      const sendDuration = Date.now() - sendStartTime;

      console.log('[Budget Warning Email] ✅ Email sent successfully:', {
        emailId: emailResult?.request_id,
        recipientEmail: client.email,
        recipientName: client.name,
        subject: subject,
        sendDuration: `${sendDuration}ms`,
        requestId,
      });

      // 9. Log activity (optional - requires teamId, so skipping for now)
      console.log('[Budget Warning Email] Step 6: Activity logging skipped (requires team context)');
      console.log('[Budget Warning Email] Email details logged:', {
        clientId: client.id,
        clientEmail: client.email,
        emailSubject: subject,
        emailId: emailResult?.request_id,
        senderName,
        senderTitle,
        senderCompany,
        requestId,
      });

      const totalDuration = Date.now() - startTime;
      console.log(`[Budget Warning Email] ========== REQUEST COMPLETE [${requestId}] ==========`);
      console.log('[Budget Warning Email] Total Duration:', `${totalDuration}ms`);
      console.log('[Budget Warning Email] Success: true\n');

      return NextResponse.json({
        success: true,
        emailId: emailResult?.request_id,
        recipient: {
          email: client.email,
          name: client.name,
        },
        duration: totalDuration,
      });
    } catch (emailError) {
      const sendDuration = Date.now() - sendStartTime;
      const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
      
      console.error('[Budget Warning Email] ❌ ZeptoMail API error:', {
        error: emailError,
        errorMessage,
        clientEmail: client.email,
        sendDuration: `${sendDuration}ms`,
        requestId,
      });
      return NextResponse.json(
        { error: 'Failed to send email', details: errorMessage },
        { status: 500 }
      );
    }

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('[Budget Warning Email] ========== REQUEST FAILED [' + requestId + '] ==========');
    console.error('[Budget Warning Email] ❌ Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      duration: `${totalDuration}ms`,
      requestId,
    });
    console.error('[Budget Warning Email] Full error object:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    );
  }
}
