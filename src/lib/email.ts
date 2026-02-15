// Email service using Zoho ZeptoMail
import { SendMailClient } from 'zeptomail';
import { getCurrencySymbol } from '@/lib/utils';

// ZeptoMail Configuration
const ZEPTOMAIL_URL: string = process.env.ZEPTOMAIL_URL || 'https://api.zeptomail.in/v1.1/email';
const ZEPTOMAIL_TOKEN: string = process.env.ZEPTOMAIL_TOKEN || '';
const FROM_EMAIL: string = process.env.ZEPTOMAIL_FROM_EMAIL || 'notify@cyth.dev';
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

// Helper function to send email via ZeptoMail
async function sendEmailViaZeptoMail(options: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const client = getZeptoClient();

    const response = await client.sendMail({
      from: {
        address: FROM_EMAIL,
        name: FROM_NAME,
      },
      to: options.to.map((recipient) => ({
        email_address: {
          address: recipient.email,
          name: recipient.name || recipient.email,
        },
      })),
      subject: options.subject,
      htmlbody: options.htmlBody,
      textbody: options.textBody,
    });

    console.log('✅ Email sent via ZeptoMail:', response);
    return { success: true, messageId: response?.request_id || 'sent' };
  } catch (error) {
    console.error('❌ ZeptoMail email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown ZeptoMail error';
    return { success: false, error: errorMessage };
  }
}

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
    if (!ZEPTOMAIL_TOKEN) {
      console.error('❌ ZEPTOMAIL_TOKEN not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${data.inviteToken}`;
    
    const result = await sendEmailViaZeptoMail({
      to: [{ email: data.recipientEmail, name: data.recipientName }],
      subject: `You're invited to join ${data.teamName} on Nesternity CRM`,
      htmlBody: generateInviteEmailHTML(data, inviteUrl),
      textBody: generateInviteEmailText(data, inviteUrl),
    });

    if (!result.success) {
      console.error('❌ Email sending failed:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Team invite email sent successfully:', result.messageId);
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

export interface PasswordResetEmailData {
  recipientEmail: string;
  recipientName?: string;
  resetToken: string;
  expiresAt: string;
}

function generatePasswordResetEmailHTML(data: PasswordResetEmailData, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Nesternity</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                <div style="display: inline-flex; align-items: center; gap: 12px;">
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 1px;">NESTERNITY</h1>
                </div>
                <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">The Calmest CRM</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Reset Your Password 🔐</h2>
                
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    Hi ${data.recipientName || 'there'},
                </p>

                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    We received a request to reset your password for your Nesternity account. Don't worry, it happens to the best of us!
                </p>

                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    To reset your password and regain access to your account, please click the button below:
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                        🔑 Reset My Password
                    </a>
                </div>

              <!-- Expiry Badge -->
                <div style="margin-top: 12px; display: inline-block; background-color: #fef3c7; color: #92400e; padding: 6px 12px; font-size: 12px; font-weight: 500; border-radius: 9999px;">
                   The link expires in 5 mins.
                </div>
            </div>

                <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
                </p>

                <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #ef4444;">
                    <p style="color: #dc2626; font-size: 14px; margin: 0; line-height: 1.5;">
                        <strong>⚠️ Important Security Notice:</strong><br>
                        • This link will expire on <strong>${new Date(data.expiresAt).toLocaleDateString()} at ${new Date(data.expiresAt).toLocaleTimeString()}</strong><br>
                        • If you didn't request this reset, please ignore this email<br>
                        • Never share this link with anyone
                    </p>
                </div>

                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #2563eb;">
                    <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.5;">
                        <strong>After resetting your password:</strong><br>
                        • Use a strong, unique password<br>
                        • Consider enabling two-factor authentication<br>
                        • Sign out of all other devices for security
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                    Need help? Contact us at <a href="mailto:support@nesternity.com" style="color: #2563eb;">support@nesternity.com</a>
                </p>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    © 2025 Nesternity. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generatePasswordResetEmailText(data: PasswordResetEmailData, resetUrl: string): string {
  return `
NESTERNITY - Password Reset Request

Hi ${data.recipientName || 'there'},

We received a request to reset your password for your Nesternity account.

Reset your password: ${resetUrl}

IMPORTANT:
- This link will expire on ${new Date(data.expiresAt).toLocaleString()}
- If you didn't request this reset, please ignore this email
- Never share this link with anyone

After resetting your password:
• Use a strong, unique password
• Consider enabling two-factor authentication  
• Sign out of all other devices for security

Need help? Contact us at support@nesternity.com

© 2025 Nesternity. All rights reserved.
  `;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ZEPTOMAIL_TOKEN) {
      console.error('❌ ZEPTOMAIL_TOKEN not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${data.resetToken}`;

    const result = await sendEmailViaZeptoMail({
      to: [{ email: data.recipientEmail, name: data.recipientName }],
      subject: 'Reset your password for Nesternity CRM',
      htmlBody: generatePasswordResetEmailHTML(data, resetUrl),
      textBody: generatePasswordResetEmailText(data, resetUrl),
    });

    if (!result.success) {
      console.error('❌ Password reset email failed:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Password reset email sent:', result.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Password reset email service error:', error);
    return { success: false, error: 'Failed to send password reset email' };
  }
}

// Proposal Email Interfaces and Functions
export interface ProposalEmailData {
  recipientEmail: string;
  recipientName: string;
  recipientCompany?: string;
  proposalTitle: string;
  proposalId: string;
  accessToken: string;
  pdfUrl?: string;
  pricing: number;
  currency: string;
  senderName: string;
  expiresAt?: string;
}

function generateProposalEmailHTML(data: ProposalEmailData, signUrl: string): string {
  // Helper for formatting date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.proposalTitle} - Proposal from Nesternity</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827; line-height: 1.6;">
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
                        
                        <tr>
                            <td align="center" style="padding: 40px 40px 20px 40px;">
                                <img src="https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/nesternity-assets/nesternity_l.png" 
                                     alt="Nesternity" 
                                     width="140" 
                                     style="display: block; width: 140px; height: auto; border: 0;">
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 0 40px 40px 40px;">
                                
                                <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #111827; text-align: center;">
                                    Proposal for ${data.proposalTitle}
                                </h1>
                                
                                <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; text-align: left;">
                                    Hi <strong>${data.recipientName}</strong>${data.recipientCompany ? `,` : ''},
                                </p>
                                
                                <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; text-align: left;">
                                    <strong>${data.senderName}</strong> has sent you a proposal for the project <strong>${data.proposalTitle}</strong>. Please review the details below.
                                </p>

                                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td style="padding-bottom: 8px; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Project Name</td>
                                            <td style="padding-bottom: 8px; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; text-align: right;">Total Investment</td>
                                        </tr>
                                        <tr>
                                            <td style="font-size: 16px; color: #111827; font-weight: 600;">${data.proposalTitle}</td>
                                            <td style="font-size: 16px; color: #2563eb; font-weight: 700; text-align: right;">
                                                ${getCurrencySymbol(data.currency)}${data.pricing.toLocaleString()}
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td align="center" style="padding-bottom: 10px;">
                                            <a href="${signUrl}" 
                                               style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 50px; text-align: center; border: 1px solid #2563eb;">
                                                Review & Sign Proposal &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                    ${data.pdfUrl ? `
                                    <tr>
                                        <td align="center" style="padding-top: 10px;">
                                            <a href="${data.pdfUrl}" style="color: #6b7280; font-size: 14px; text-decoration: none;">
                                                Download PDF version
                                            </a>
                                        </td>
                                    </tr>
                                    ` : ''}
                                </table>

                                <div style="margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 30px;">
                                    
                                    <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 700; color: #111827;">What happens next?</h3>
                                    <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
                                        <li style="margin-bottom: 8px;">Review the full scope and terms using the button above.</li>
                                        <li style="margin-bottom: 8px;">If everything looks good, sign electronically to accept.</li>
                                        <li>Once signed, we can officially kick off the project!</li>
                                    </ul>

                                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px;">
                                         ${data.expiresAt ? `
                                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #b45309;">
                                                <strong>⏰ Valid Until:</strong> ${formatDate(data.expiresAt)}
                                            </p>
                                        ` : ''}
                                        <p style="margin: 0; font-size: 13px; color: #6b7280;">
                                            <strong>🔒 Secure:</strong> This link is unique to you. Your signature will be legally binding and IP tracked for security.
                                        </p>
                                    </div>

                                </div>

                                <p style="margin-top: 30px; font-size: 14px; color: #4b5563;">
                                    Questions? Just reply to this email.
                                    <br><br>
                                    Best,<br>
                                    <strong>${data.senderName}</strong> via Nesternity
                                </p>

                            </td>
                        </tr>
                    </table>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                        <tr>
                            <td align="center" style="padding: 24px 0;">
                                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                    © ${new Date().getFullYear()} Nesternity. All rights reserved.<br>
                                    Professional Project Management
                                </p>
                            </td>
                        </tr>
                    </table>

                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
}

function generateProposalEmailText(data: ProposalEmailData, signUrl: string): string {
  const expiryText = data.expiresAt 
    ? `\n⏰ VALID UNTIL: ${new Date(data.expiresAt).toLocaleDateString()}` 
    : '';

  return `
PROPOSAL FOR ${data.proposalTitle.toUpperCase()}
------------------------------------------------

Hi ${data.recipientName},

${data.senderName} has sent you a proposal for the project "${data.proposalTitle}".

SUMMARY
-------
Project: ${data.proposalTitle}
Investment: ${getCurrencySymbol(data.currency)}${data.pricing.toLocaleString()}

ACTION REQUIRED
---------------
Please review and sign the proposal at the link below:

${signUrl}

${data.pdfUrl ? `(Download PDF: ${data.pdfUrl})` : ''}

WHAT'S NEXT?
1. Review the full scope and terms.
2. Sign electronically to accept.
3. Project kickoff begins!
${expiryText}

Questions? Reply to this email.

Best,
${data.senderName} via Nesternity
  `;
}

export async function sendProposalEmail(data: ProposalEmailData): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    if (!ZEPTOMAIL_TOKEN) {
      console.error('❌ ZEPTOMAIL_TOKEN not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const signUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/proposals/${data.proposalId}/sign?token=${data.accessToken}`;

    console.log('📧 Sending proposal email to:', data.recipientEmail);

    const result = await sendEmailViaZeptoMail({
      to: [{ email: data.recipientEmail, name: data.recipientName }],
      subject: `${data.proposalTitle} - Review & Sign Your Proposal`,
      htmlBody: generateProposalEmailHTML(data, signUrl),
      textBody: generateProposalEmailText(data, signUrl),
    });

    if (!result.success) {
      console.error('❌ Proposal email failed:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Proposal email sent successfully:', result.messageId);
    return { success: true, emailId: result.messageId };
  } catch (error) {
    console.error('❌ Proposal email service error:', error);
    return { success: false, error: 'Failed to send proposal email' };
  }
}

// Invoice Email Interface
export interface InvoiceEmailData {
  recipientEmail: string;
  ccEmails?: string[];
  clientName: string;
  invoiceNumber: string;
  emailHtml: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    console.log('📧 Sending invoice email to:', data.recipientEmail);

    const emailOptions: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      cc?: string[];
    } = {
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [data.recipientEmail],
      subject: `Invoice ${data.invoiceNumber} - ${data.clientName}`,
      html: data.emailHtml,
    };

    // Add CC recipients if provided
    if (data.ccEmails && data.ccEmails.length > 0) {
      emailOptions.cc = data.ccEmails;
    }

    const { data: emailResult, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('❌ Invoice email failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Invoice email sent successfully:', emailResult?.id);
    return { success: true, emailId: emailResult?.id };
  } catch (error) {
    console.error('❌ Invoice email service error:', error);
    return { success: false, error: 'Failed to send invoice email' };
  }
}
