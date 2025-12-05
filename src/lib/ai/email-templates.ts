/**
 * AI-powered email template generation
 * Scope creep warnings, recurring invoices, notifications
 */

import adapter from './adapter';
import { getCurrencySymbol } from '@/lib/utils';

export interface ScopeCreepEmailData {
  clientName: string;
  projectName: string;
  originalBudget: number;
  currentSpend: number;
  overrunAmount: number;
  overrunPercent: number;
  remainingBudget: number;
  flaggedItems: Array<{
    item: string;
    cost: number;
    reason?: string;
  }>;
  currency: string;
  contactEmail: string;
}

export interface RecurringInvoiceEmailData {
  clientName: string;
  companyName?: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  currency: string;
  recurrence: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    total: number;
  }>;
  paymentLink?: string;
}

/**
 * Generate professional scope creep warning email
 */
export async function generateScopeCreepWarningEmail(
  data: ScopeCreepEmailData
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are a professional project manager writing to a valued client about budget concerns.

Guidelines:
- Be polite, professional, and solution-oriented
- Show transparency about budget status
- Emphasize partnership and collaboration
- Suggest next steps (meeting, change order, scope review)
- Maintain positive tone while being clear about constraints
- Include specific numbers and facts`,
    },
    {
      role: 'user' as const,
      content: `Generate a professional email to ${data.clientName} about budget concerns for ${data.projectName}.

**Budget Status:**
- Original Budget: ${getCurrencySymbol(data.currency)}${data.originalBudget.toLocaleString()}
- Current Spend: ${getCurrencySymbol(data.currency)}${data.currentSpend.toLocaleString()}
${data.overrunAmount > 0 ? `- **Budget Overrun: ${getCurrencySymbol(data.currency)}${data.overrunAmount.toLocaleString()} (${data.overrunPercent.toFixed(1)}%)**` : `- Remaining Budget: ${getCurrencySymbol(data.currency)}${data.remainingBudget.toLocaleString()}`}

${data.flaggedItems.length > 0 ? `**Contributing Factors:**
${data.flaggedItems.map(item => `- ${item.item}: ${getCurrencySymbol(data.currency)}${item.cost.toLocaleString()}${item.reason ? ` (${item.reason})` : ''}`).join('\n')}` : ''}

The email should:
1. Thank them for their business
2. Provide clear budget update with numbers
3. Explain contributing factors professionally
4. Suggest scheduling a brief call to discuss options
5. Offer solutions (scope adjustment, change order, phased approach)
6. Maintain positive relationship

Contact: ${data.contactEmail}

Return only the complete HTML email body (including greeting and signature).`,
    },
  ];

  try {
    const result = await adapter.generateStructuredCompletion<{ html: string }>(messages, {
      temperature: 0.7,
      maxTokens: 2048,
    });

    return result.data.html || generateFallbackScopeCreepEmail(data);
  } catch (error) {
    console.error('AI email generation failed, using fallback:', error);
    return generateFallbackScopeCreepEmail(data);
  }
}

/**
 * Generate professional recurring invoice email
 */
export async function generateRecurringInvoiceEmail(
  data: RecurringInvoiceEmailData
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are writing a professional recurring invoice email for ongoing services.

Guidelines:
- Thank client for continued partnership
- Be clear and professional
- Include all invoice details
- Mention payment due date
- Provide payment instructions
- Keep tone warm but business-like`,
    },
    {
      role: 'user' as const,
      content: `Generate a professional recurring invoice email:

**Client:** ${data.clientName}${data.companyName ? ` (${data.companyName})` : ''}
**Invoice:** ${data.invoiceNumber}
**Amount:** ${getCurrencySymbol(data.currency)}${data.amount.toLocaleString()}
**Due Date:** ${data.dueDate}
**Frequency:** ${data.recurrence}

**Line Items:**
${data.items.map(item => `- ${item.description}: ${item.quantity} × ${getCurrencySymbol(data.currency)}${item.rate} = ${getCurrencySymbol(data.currency)}${item.total.toLocaleString()}`).join('\n')}

${data.paymentLink ? `**Payment Link:** ${data.paymentLink}` : ''}

The email should:
1. Warm greeting with appreciation for continued business
2. Clear invoice details in formatted section
3. Payment instructions and due date
4. Contact information for questions
5. Professional closing

Return only the complete HTML email body.`,
    },
  ];

  try {
    const result = await adapter.generateStructuredCompletion<{ html: string }>(messages, {
      temperature: 0.7,
      maxTokens: 1536,
    });

    return result.data.html || generateFallbackRecurringInvoiceEmail(data);
  } catch (error) {
    console.error('AI email generation failed, using fallback:', error);
    return generateFallbackRecurringInvoiceEmail(data);
  }
}

/**
 * Fallback scope creep warning email
 */
function generateFallbackScopeCreepEmail(data: ScopeCreepEmailData): string {
  const currencySymbol = getCurrencySymbol(data.currency);
  const isCritical = data.overrunAmount > 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Budget Update</title>
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
                            
                            <h1 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 700; color: #111827; text-align: center;">
                                Project Budget Update
                            </h1>
                            
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
                                Hi <strong>${data.clientName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
                                I'm writing to keep you updated on the budget status for <strong>${data.projectName}</strong>. Transparency is key to our partnership, and we want to ensure we stay aligned on project scope and costs.
                            </p>

                            <div style="background-color: ${isCritical ? '#fef2f2' : '#f0f9ff'}; border: 1px solid ${isCritical ? '#fecaca' : '#bae6fd'}; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 700; color: ${isCritical ? '#991b1b' : '#0369a1'}; text-transform: uppercase;">
                                    ${isCritical ? '⚠️ Budget Alert' : '📊 Budget Snapshot'}
                                </h3>
                                
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                                    <tr>
                                        <td style="padding-bottom: 8px; color: #4b5563;">Original Budget:</td>
                                        <td style="padding-bottom: 8px; text-align: right; font-weight: 600; color: #111827;">
                                            ${currencySymbol}${data.originalBudget.toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 8px; color: #4b5563;">Current Spend:</td>
                                        <td style="padding-bottom: 8px; text-align: right; font-weight: 600; color: #111827;">
                                            ${currencySymbol}${data.currentSpend.toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr style="border-top: 1px solid ${isCritical ? '#fecaca' : '#bae6fd'};">
                                        <td style="padding-top: 8px; font-weight: 700; color: ${isCritical ? '#dc2626' : '#111827'};">
                                            ${isCritical ? 'Overrun Amount:' : 'Remaining:'}
                                        </td>
                                        <td style="padding-top: 8px; text-align: right; font-weight: 700; color: ${isCritical ? '#dc2626' : '#2563eb'};">
                                            ${currencySymbol}${isCritical ? data.overrunAmount.toLocaleString() : data.remainingBudget.toLocaleString()}
                                            ${isCritical ? ` (${data.overrunPercent.toFixed(1)}%)` : ''}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            ${data.flaggedItems.length > 0 ? `
                            <div style="margin-bottom: 30px;">
                                <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #374151;">Contributing Factors:</h4>
                                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
                                    ${data.flaggedItems.map(item => `
                                    <li style="margin-bottom: 5px;">
                                        <strong>${item.item}</strong>: ${currencySymbol}${item.cost.toLocaleString()}
                                        ${item.reason ? `<br><span style="font-size: 13px; color: #6b7280; font-style: italic;">${item.reason}</span>` : ''}
                                    </li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}

                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                                <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827; font-weight: 600;">Suggested Next Steps:</p>
                                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
                                    <li style="margin-bottom: 5px;">Review current project scope priorities.</li>
                                    <li style="margin-bottom: 5px;">Discuss a potential change order for additional requirements.</li>
                                    <li>Explore phased delivery options to manage costs.</li>
                                </ul>
                            </div>

                            <p style="margin-top: 30px; font-size: 15px; color: #4b5563;">
                                Let's schedule a brief 15-minute call this week to discuss the best path forward. I'm confident we can find a solution that works for everyone.
                            </p>
                            
                            <p style="margin-top: 30px; font-size: 15px; color: #4b5563;">
                                Best regards,<br>
                                <strong>Your Team</strong>
                            </p>
                            
                        </td>
                    </tr>
                </table>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 24px 0;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} Nesternity.<br>
                                Automated budget monitoring alert.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}

/**
 * Fallback recurring invoice email
 */
function generateFallbackRecurringInvoiceEmail(data: RecurringInvoiceEmailData): string {
  const currencySymbol = getCurrencySymbol(data.currency);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Invoice from Nesternity</title>
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
                            
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700; color: #111827;">
                                    ${currencySymbol}${data.amount.toLocaleString()}
                                </h1>
                                <p style="margin: 0; font-size: 15px; color: #6b7280; font-weight: 500;">
                                    due on ${data.dueDate}
                                </p>
                            </div>
                            
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
                                Hi <strong>${data.clientName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
                                Thank you for your continued partnership. Here is your <strong>${data.recurrence.toLowerCase()} invoice</strong> for the recent period.
                            </p>

                            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 15px;">
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td style="font-size: 13px; color: #6b7280;">Invoice No.</td>
                                            <td style="text-align: right; font-size: 13px; font-weight: 600; color: #111827;">${data.invoiceNumber}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-size: 13px; color: #6b7280;">Issue Date</td>
                                            <td style="text-align: right; font-size: 13px; font-weight: 600; color: #111827;">${new Date().toLocaleDateString()}</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                                    ${data.items.map(item => `
                                    <tr>
                                        <td style="padding-bottom: 8px; color: #374151;">
                                            ${item.description} <span style="color: #9ca3af; font-size: 12px;">×${item.quantity}</span>
                                        </td>
                                        <td style="padding-bottom: 8px; text-align: right; color: #111827; font-weight: 500;">
                                            ${currencySymbol}${item.total.toLocaleString()}
                                        </td>
                                    </tr>
                                    `).join('')}
                                    <tr style="border-top: 2px solid #e5e7eb;">
                                        <td style="padding-top: 12px; font-weight: 700; color: #111827;">Total Due</td>
                                        <td style="padding-top: 12px; text-align: right; font-weight: 700; color: #2563eb; font-size: 16px;">
                                            ${currencySymbol}${data.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            ${data.paymentLink ? `
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="${data.paymentLink}" 
                                           style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 50px; text-align: center; border: 1px solid #2563eb;">
                                            Pay Invoice &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
                                If you have any questions, just reply to this email.
                            </p>
                            
                        </td>
                    </tr>
                </table>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 24px 0;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} Nesternity.<br>
                                123 Tech Street, Innovation District, Bangalore
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}
