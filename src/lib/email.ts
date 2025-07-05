// Email service using Resend
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailInviteData {
  recipientEmail: string;
  recipientName?: string;
  teamName: string;
  inviterName: string;
  inviteToken: string;
  expiresAt: string;
}

export async function sendTeamInviteEmail(data: EmailInviteData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${data.inviteToken}`;
    
    const { data: emailResult, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [data.recipientEmail],
      subject: `You're invited to join ${data.teamName} on Nesternity CRM`,
      html: generateInviteEmailHTML(data, inviteUrl),
      text: generateInviteEmailText(data, inviteUrl),
    });

    if (error) {
      console.error('❌ Email sending failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent successfully:', emailResult?.id);
    return { success: true };

  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

function generateInviteEmailHTML(data: EmailInviteData, inviteUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation</title>
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
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .invite-button {
          display: inline-block;
          background-color: #6366f1;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .details {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">🚀 Nesternity CRM</div>
          <h1>You're Invited!</h1>
        </div>
        
        <p>Hi ${data.recipientName || 'there'},</p>
        
        <p><strong>${data.inviterName}</strong> has invited you to join the <strong>${data.teamName}</strong> team on Nesternity CRM.</p>
        
        <div style="text-align: center;">
          <a href="${inviteUrl}" class="invite-button">Accept Invitation</a>
        </div>
        
        <div class="details">
          <h3>What's next?</h3>
          <ol>
            <li>Click the "Accept Invitation" button above</li>
            <li>Create your account or sign in if you already have one</li>
            <li>Start collaborating with your team!</li>
          </ol>
        </div>

        <p><strong>Note:</strong> To accept this invitation, you must be signed in to your Nesternity CRM account. If you don't have an account yet, you'll need to sign up first.</p>
        
        <p><strong>Important:</strong> This invitation expires on ${new Date(data.expiresAt).toLocaleDateString()} at ${new Date(data.expiresAt).toLocaleTimeString()}.</p>
        
        <div class="footer">
          <p>If you can't click the button above, copy and paste this link into your browser:</p>
          <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          
          <p>Best regards,<br>The Nesternity CRM Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateInviteEmailText(data: EmailInviteData, inviteUrl: string): string {
  return `
🚀 Nesternity CRM - Team Invitation

Hi ${data.recipientName || 'there'},

${data.inviterName} has invited you to join the "${data.teamName}" team on Nesternity CRM.

Accept your invitation: ${inviteUrl}

What's next?
1. Click the link above
2. Create your account or sign in if you already have one  
3. Start collaborating with your team!

Important: This invitation expires on ${new Date(data.expiresAt).toLocaleDateString()} at ${new Date(data.expiresAt).toLocaleTimeString()}.

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The Nesternity CRM Team
  `;
}
