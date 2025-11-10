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
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.proposalTitle} - Proposal from Nesternity</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 45px 35px; text-align: center;">
                <div style="display: inline-flex; align-items: center; gap: 12px;">
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 1.5px;">NESTERNITY</h1>
                </div>
                <p style="color: #e0e7ff; margin: 12px 0 0 0; font-size: 16px; font-weight: 500;">Professional Project Proposal</p>
            </div>

            <!-- Content -->
            <div style="padding: 45px 35px;">
                <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin-bottom: 20px;">New Proposal Awaiting Your Review 📋</h2>
                
                <p style="color: #475569; font-size: 17px; line-height: 1.7; margin-bottom: 20px;">
                    Hi <strong>${data.recipientName}</strong>${data.recipientCompany ? ` from <strong>${data.recipientCompany}</strong>` : ''},
                </p>

                <p style="color: #475569; font-size: 17px; line-height: 1.7; margin-bottom: 25px;">
                    We're excited to present a new proposal for your project. This proposal has been carefully crafted to meet your requirements and deliver exceptional value.
                </p>

                <!-- Proposal Summary Card -->
                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0ea5e9; padding: 25px; border-radius: 10px; margin: 30px 0;">
                    <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">📊 Proposal Overview</h3>
                    <div style="margin: 10px 0;">
                        <span style="color: #64748b; font-size: 14px;">Project:</span><br>
                        <strong style="color: #1e293b; font-size: 18px;">${data.proposalTitle}</strong>
                    </div>
                    <div style="margin: 15px 0 0 0;">
                        <span style="color: #64748b; font-size: 14px;">Investment:</span><br>
                        <strong style="color: #0ea5e9; font-size: 24px; font-weight: bold;">
                            ${data.currency === 'INR' ? '₹' : '$'}${data.pricing.toLocaleString()}
                        </strong>
                    </div>
                </div>

                <!-- CTA Buttons -->
                <div style="text-align: center; margin: 40px 0 35px 0;">
                    <a href="${signUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 10px; font-weight: 600; font-size: 17px; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4); margin-bottom: 15px;">
                        ✍️ Review & Sign Proposal
                    </a>
                    ${data.pdfUrl ? `
                    <br><br>
                    <a href="${data.pdfUrl}" 
                       style="display: inline-block; background-color: #ffffff; color: #6366f1; text-decoration: none; padding: 16px 36px; border-radius: 10px; font-weight: 600; font-size: 16px; border: 2px solid #6366f1;">
                        📄 Download PDF
                    </a>
                    ` : ''}
                </div>

                <!-- What's Next Section -->
                <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; margin-top: 30px;">
                    <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">🚀 What Happens Next?</h3>
                    <ol style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                        <li><strong>Review the proposal</strong> – Take your time to read through all details</li>
                        <li><strong>Ask questions</strong> – Contact us if you need clarification</li>
                        <li><strong>Sign electronically</strong> – Use the secure link above to accept</li>
                        <li><strong>Start the project</strong> – We'll begin work immediately after approval</li>
                    </ol>
                </div>

                ${data.expiresAt ? `
                <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #f59e0b;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                        <strong>⏰ Time-Sensitive:</strong><br>
                        This proposal is valid until <strong>${new Date(data.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong> at <strong>${new Date(data.expiresAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</strong>.
                    </p>
                </div>
                ` : ''}

                <!-- Security Notice -->
                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #22c55e;">
                    <p style="color: #15803d; font-size: 14px; margin: 0; line-height: 1.6;">
                        <strong>🔒 Secure & Private:</strong><br>
                        • This link is unique to you and expires after use<br>
                        • All communications are encrypted<br>
                        • Your signature is legally binding and tracked<br>
                        • IP address and timestamp are recorded for security
                    </p>
                </div>

                <!-- Help Section -->
                <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0;">
                        <strong style="color: #1e293b;">Need assistance?</strong><br>
                        We're here to help! Reply to this email or contact <strong>${data.senderName}</strong> directly.
                    </p>
                </div>

                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                    Looking forward to working together! 🤝
                </p>

                <p style="color: #475569; font-size: 16px; margin-top: 20px;">
                    Best regards,<br>
                    <strong>${data.senderName}</strong>
                </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 35px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0;">
                    Powered by <strong style="color: #6366f1;">Nesternity</strong> – Professional Project Management
                </p>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    If you can't click the button, copy this link:<br>
                    <a href="${signUrl}" style="color: #6366f1; word-break: break-all;">${signUrl}</a>
                </p>
                <p style="color: #cbd5e1; font-size: 11px; margin: 15px 0 0 0;">
                    © ${new Date().getFullYear()} Nesternity. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateProposalEmailText(data: ProposalEmailData, signUrl: string): string {
  return `
NESTERNITY - Professional Project Proposal

New Proposal Awaiting Your Review

Hi ${data.recipientName}${data.recipientCompany ? ` from ${data.recipientCompany}` : ''},

We're excited to present a new proposal for your project.

PROPOSAL OVERVIEW
================
Project: ${data.proposalTitle}
Investment: ${data.currency === 'INR' ? '₹' : '$'}${data.pricing.toLocaleString()}

REVIEW & SIGN
${signUrl}

${data.pdfUrl ? `DOWNLOAD PDF\n${data.pdfUrl}\n` : ''}

WHAT HAPPENS NEXT?
==================
1. Review the proposal – Take your time to read through all details
2. Ask questions – Contact us if you need clarification
3. Sign electronically – Use the secure link above to accept
4. Start the project – We'll begin work immediately after approval

${data.expiresAt ? `⏰ TIME-SENSITIVE: This proposal is valid until ${new Date(data.expiresAt).toLocaleString()}\n` : ''}

🔒 SECURITY NOTICE:
• This link is unique to you and expires after use
• All communications are encrypted
• Your signature is legally binding and tracked
• IP address and timestamp are recorded for security

Need assistance? Reply to this email or contact ${data.senderName} directly.

Looking forward to working together!

Best regards,
${data.senderName}

---
Powered by Nesternity – Professional Project Management
© ${new Date().getFullYear()} Nesternity. All rights reserved.
  `;
}

export async function sendProposalEmail(data: ProposalEmailData): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const signUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/proposals/${data.proposalId}/sign?token=${data.accessToken}`;

    console.log('📧 Sending proposal email to:', data.recipientEmail);

    const { data: emailResult, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [data.recipientEmail],
      subject: `${data.proposalTitle} - Review & Sign Your Proposal`,
      html: generateProposalEmailHTML(data, signUrl),
      text: generateProposalEmailText(data, signUrl),
    });

    if (error) {
      console.error('❌ Proposal email failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Proposal email sent successfully:', emailResult?.id);
    return { success: true, emailId: emailResult?.id };
  } catch (error) {
    console.error('❌ Proposal email service error:', error);
    return { success: false, error: 'Failed to send proposal email' };
  }
}
