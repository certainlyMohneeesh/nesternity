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
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${data.resetToken}`;

    const { data: emailResult, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [data.recipientEmail],
      subject: 'Reset your password for Nesternity CRM',
      html: generatePasswordResetEmailHTML(data, resetUrl),
      text: generatePasswordResetEmailText(data, resetUrl),
    });

    if (error) {
      console.error('❌ Password reset email failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Password reset email sent:', emailResult?.id);
    return { success: true };
  } catch (error) {
    console.error('❌ Password reset email service error:', error);
    return { success: false, error: 'Failed to send password reset email' };
  }
}
