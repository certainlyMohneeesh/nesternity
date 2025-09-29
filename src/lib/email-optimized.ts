import { queueTeamInviteEmail, queuePasswordResetEmail } from './email-queue';
import { EmailInviteData, PasswordResetEmailData } from './email';

// Fast, non-blocking email service using queues
export class OptimizedEmailService {
  
  // Team invite emails - queued for immediate processing
  static async sendTeamInviteEmail(data: EmailInviteData): Promise<{ success: boolean; error?: string }> {
    try {
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${data.inviteToken}`;
      
      const result = await queueTeamInviteEmail({
        to: data.recipientEmail,
        teamName: data.teamName,
        inviterName: data.inviterName,
        inviteUrl,
        recipientName: data.recipientName,
      });
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      console.log(`✅ Team invite queued successfully: Job ${result.jobId}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to queue team invite email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }
  
  // Password reset emails - queued for immediate processing
  static async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${data.resetToken}`;
      
      const result = await queuePasswordResetEmail({
        to: data.recipientEmail,
        resetUrl,
        recipientName: data.recipientName,
        expiresAt: data.expiresAt,
      });
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      console.log(`✅ Password reset email queued successfully: Job ${result.jobId}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to queue password reset email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }
  
  // Batch email processing for multiple recipients
  static async sendBatchInvites(invites: EmailInviteData[]): Promise<{ 
    success: boolean; 
    processed: number; 
    failed: number; 
    errors?: string[] 
  }> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Process in batches of 5 to avoid overwhelming the queue
    const batchSize = 5;
    
    for (let i = 0; i < invites.length; i += batchSize) {
      const batch = invites.slice(i, i + batchSize);
      
      const promises = batch.map(async (invite) => {
        const result = await this.sendTeamInviteEmail(invite);
        if (result.success) {
          processed++;
        } else {
          failed++;
          if (result.error) {
            errors.push(`${invite.recipientEmail}: ${result.error}`);
          }
        }
        return result;
      });
      
      await Promise.allSettled(promises);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < invites.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
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

// Export for backward compatibility
export const sendTeamInviteEmail = OptimizedEmailService.sendTeamInviteEmail;
export const sendPasswordResetEmail = OptimizedEmailService.sendPasswordResetEmail;