import { OptimizedEmailService } from './email-optimized';
import { sendTeamInviteEmail as legacySendTeamInvite, sendPasswordResetEmail as legacySendPasswordReset, EmailInviteData, PasswordResetEmailData } from './email';

// Migration wrapper - automatically uses optimized service if available
export async function sendTeamInviteEmail(data: EmailInviteData): Promise<{ success: boolean; error?: string }> {
  // Check if Redis is available for queue processing
  try {
    return await OptimizedEmailService.sendTeamInviteEmail(data);
  } catch (queueError) {
    console.warn('⚠️ Queue unavailable, falling back to direct email sending:', queueError);
    // Fallback to legacy direct sending
    return await legacySendTeamInvite(data);
  }
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    return await OptimizedEmailService.sendPasswordResetEmail(data);
  } catch (queueError) {
    console.warn('⚠️ Queue unavailable, falling back to direct email sending:', queueError);
    // Fallback to legacy direct sending
    return await legacySendPasswordReset(data);
  }
}

// New batch processing capability
export async function sendBatchInvites(invites: EmailInviteData[]): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[]
}> {
  try {
    return await OptimizedEmailService.sendBatchInvites(invites);
  } catch (queueError) {
    console.warn('⚠️ Queue unavailable, processing invites individually:', queueError);
    
    // Fallback: process individually
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const invite of invites) {
      const result = await legacySendTeamInvite(invite);
      if (result.success) {
        processed++;
      } else {
        failed++;
        if (result.error) {
          errors.push(`${invite.recipientEmail}: ${result.error}`);
        }
      }
    }
    
    return {
      success: failed === 0,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

// Export types for backward compatibility
export type { EmailInviteData, PasswordResetEmailData };