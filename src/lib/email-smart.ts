import { OptimizedEmailService } from './email-optimized';
import { sendTeamInviteEmail as legacySendTeamInvite, sendPasswordResetEmail as legacySendPasswordReset, EmailInviteData, PasswordResetEmailData } from './email';

// Smart email service that falls back gracefully when Redis is unavailable
class SmartEmailService {
  private static isRedisAvailable: boolean | null = null;
  
  private static async checkRedisAvailability(): Promise<boolean> {
    if (SmartEmailService.isRedisAvailable !== null) {
      return SmartEmailService.isRedisAvailable;
    }
    
    try {
      // Try importing and testing Redis connection
      const { redis } = await import('./redis');
      await redis.ping();
      SmartEmailService.isRedisAvailable = true;
      console.log('✅ Redis available - using optimized email queue');
      return true;
    } catch (error) {
      SmartEmailService.isRedisAvailable = false;
      console.log('⚠️ Redis unavailable - using direct email sending');
      return false;
    }
  }
  
  static async sendTeamInviteEmail(data: EmailInviteData): Promise<{ success: boolean; error?: string }> {
    try {
      const redisAvailable = await SmartEmailService.checkRedisAvailability();
      
      if (redisAvailable) {
        return await OptimizedEmailService.sendTeamInviteEmail(data);
      } else {
        console.log('📧 Sending team invite email directly (no queue)...');
        return await legacySendTeamInvite(data);
      }
    } catch (error) {
      console.error('❌ Email service error, falling back to direct sending:', error);
      return await legacySendTeamInvite(data);
    }
  }
  
  static async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const redisAvailable = await SmartEmailService.checkRedisAvailability();
      
      if (redisAvailable) {
        return await OptimizedEmailService.sendPasswordResetEmail(data);
      } else {
        console.log('📧 Sending password reset email directly (no queue)...');
        return await legacySendPasswordReset(data);
      }
    } catch (error) {
      console.error('❌ Email service error, falling back to direct sending:', error);
      return await legacySendPasswordReset(data);
    }
  }
}

// Export the smart service functions
export const sendTeamInviteEmail = SmartEmailService.sendTeamInviteEmail;
export const sendPasswordResetEmail = SmartEmailService.sendPasswordResetEmail;

// Export types for backward compatibility
export type { EmailInviteData, PasswordResetEmailData };