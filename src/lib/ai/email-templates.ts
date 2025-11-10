/**
 * AI-powered email template generation
 * Scope creep warnings, recurring invoices, notifications
 */

import { generateStructuredCompletion } from './gemini';

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
- Original Budget: ${data.currency === 'INR' ? '₹' : '$'}${data.originalBudget.toLocaleString()}
- Current Spend: ${data.currency === 'INR' ? '₹' : '$'}${data.currentSpend.toLocaleString()}
${data.overrunAmount > 0 ? `- **Budget Overrun: ${data.currency === 'INR' ? '₹' : '$'}${data.overrunAmount.toLocaleString()} (${data.overrunPercent.toFixed(1)}%)**` : `- Remaining Budget: ${data.currency === 'INR' ? '₹' : '$'}${data.remainingBudget.toLocaleString()}`}

${data.flaggedItems.length > 0 ? `**Contributing Factors:**
${data.flaggedItems.map(item => `- ${item.item}: ${data.currency === 'INR' ? '₹' : '$'}${item.cost.toLocaleString()}${item.reason ? ` (${item.reason})` : ''}`).join('\n')}` : ''}

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
    const result = await generateStructuredCompletion<{ html: string }>(messages, {
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
**Amount:** ${data.currency === 'INR' ? '₹' : '$'}${data.amount.toLocaleString()}
**Due Date:** ${data.dueDate}
**Frequency:** ${data.recurrence}

**Line Items:**
${data.items.map(item => `- ${item.description}: ${item.quantity} × ${data.currency === 'INR' ? '₹' : '$'}${item.rate} = ${data.currency === 'INR' ? '₹' : '$'}${item.total.toLocaleString()}`).join('\n')}

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
    const result = await generateStructuredCompletion<{ html: string }>(messages, {
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
  const currencySymbol = data.currency === 'INR' ? '₹' : '$';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #f8f9fa; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .budget-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .budget-box.critical { background: #f8d7da; border-left-color: #dc3545; }
    .items { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Project Budget Update</h2>
  </div>
  
  <div class="content">
    <p>Dear ${data.clientName},</p>
    
    <p>I hope this email finds you well. I wanted to reach out to provide an important update regarding the budget for <strong>${data.projectName}</strong>.</p>
    
    <div class="budget-box${data.overrunAmount > 0 ? ' critical' : ''}">
      <h3>Budget Status</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td><strong>Original Budget:</strong></td>
          <td style="text-align: right;">${currencySymbol}${data.originalBudget.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>Current Spend:</strong></td>
          <td style="text-align: right;">${currencySymbol}${data.currentSpend.toLocaleString()}</td>
        </tr>
        ${data.overrunAmount > 0 ? `
        <tr style="color: #dc3545;">
          <td><strong>Budget Overrun:</strong></td>
          <td style="text-align: right;">${currencySymbol}${data.overrunAmount.toLocaleString()} (${data.overrunPercent.toFixed(1)}%)</td>
        </tr>
        ` : `
        <tr>
          <td><strong>Remaining Budget:</strong></td>
          <td style="text-align: right;">${currencySymbol}${data.remainingBudget.toLocaleString()}</td>
        </tr>
        `}
      </table>
    </div>
    
    ${data.flaggedItems.length > 0 ? `
    <div class="items">
      <h4>Contributing Factors:</h4>
      <ul>
        ${data.flaggedItems.map(item => `
        <li>${item.item}: ${currencySymbol}${item.cost.toLocaleString()}${item.reason ? ` — ${item.reason}` : ''}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    <p>I value our partnership and want to ensure we maintain transparency throughout this project. I'd love to schedule a brief call to discuss the best path forward.</p>
    
    <p><strong>Possible Next Steps:</strong></p>
    <ul>
      <li>Review and adjust project scope</li>
      <li>Prepare a change order for additional work</li>
      <li>Consider a phased delivery approach</li>
    </ul>
    
    <p>Please let me know your availability for a 15-minute call this week. I'm confident we can find a solution that works for both of us.</p>
    
    <p>Thank you for your understanding and continued trust in our work.</p>
    
    <p>Best regards,<br/>
    <strong>Your Team</strong><br/>
    <a href="mailto:${data.contactEmail}">${data.contactEmail}</a></p>
  </div>
  
  <div class="footer">
    This is an automated budget monitoring alert. Please reply if you have any questions.
  </div>
</body>
</html>
  `.trim();
}

/**
 * Fallback recurring invoice email
 */
function generateFallbackRecurringInvoiceEmail(data: RecurringInvoiceEmailData): string {
  const currencySymbol = data.currency === 'INR' ? '₹' : '$';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .invoice-box { background: #f8f9fa; border: 2px solid #4f46e5; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .items { margin: 15px 0; }
    .items table { width: 100%; border-collapse: collapse; }
    .items th { text-align: left; border-bottom: 2px solid #ddd; padding: 8px; }
    .items td { padding: 8px; border-bottom: 1px solid #eee; }
    .total { font-size: 18px; font-weight: bold; color: #4f46e5; }
    .payment-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Invoice ${data.invoiceNumber}</h2>
    <p>${data.recurrence} Service Invoice</p>
  </div>
  
  <div class="content">
    <p>Dear ${data.clientName},</p>
    
    <p>Thank you for your continued partnership! Please find your ${data.recurrence.toLowerCase()} invoice below.</p>
    
    <div class="invoice-box">
      <h3>Invoice Details</h3>
      <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
      <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Due Date:</strong> ${data.dueDate}</p>
      ${data.companyName ? `<p><strong>Company:</strong> ${data.companyName}</p>` : ''}
      
      <div class="items">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${currencySymbol}${item.rate.toLocaleString()}</td>
              <td style="text-align: right;">${currencySymbol}${item.total.toLocaleString()}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <p class="total">Total Amount Due: ${currencySymbol}${data.amount.toLocaleString()}</p>
    </div>
    
    ${data.paymentLink ? `
    <div style="text-align: center;">
      <a href="${data.paymentLink}" class="payment-button">Pay Invoice Online</a>
    </div>
    ` : ''}
    
    <p>Payment is due by <strong>${data.dueDate}</strong>. If you have any questions about this invoice, please don't hesitate to reach out.</p>
    
    <p>We appreciate your business and look forward to continuing our work together!</p>
    
    <p>Best regards,<br/>
    <strong>Your Team</strong></p>
  </div>
  
  <div class="footer">
    <p>This is an automated recurring invoice. For questions, please contact our support team.</p>
  </div>
</body>
</html>
  `.trim();
}
