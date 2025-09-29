import { Queue, Worker, Job } from 'bullmq';
import { redis } from './redis';
import { Resend } from 'resend';

// Email job types
export interface EmailJob {
  type: 'team-invite' | 'password-reset' | 'notification';
  to: string;
  subject: string;
  html: string;
  text: string;
  priority?: number;
  delay?: number;
}

// Optimized Resend client with connection pooling
class ResendService {
  private static instance: Resend | null = null;
  private static connectionPool: Map<string, Resend> = new Map();
  
  static getInstance(): Resend {
    if (!ResendService.instance) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is required');
      }
      
      ResendService.instance = new Resend(process.env.RESEND_API_KEY);
    }
    return ResendService.instance;
  }
}

// Email Queue with industry-standard configuration
export const emailQueue = new Queue('email', {
  connection: redis,
  defaultJobOptions: {
    // Retry configuration with exponential backoff
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
    // Remove completed jobs after 24 hours
    removeOnComplete: 100,
    // Remove failed jobs after 7 days
    removeOnFail: 50,
  },
});

// Rate limiting configuration (industry standard)
const RATE_LIMITS = {
  'team-invite': { max: 10, duration: 60000 }, // 10 invites per minute
  'password-reset': { max: 5, duration: 300000 }, // 5 resets per 5 minutes
  'notification': { max: 50, duration: 60000 }, // 50 notifications per minute
};

// Email worker with optimized processing
export const emailWorker = new Worker(
  'email',
  async (job: Job<EmailJob>) => {
    const { type, to, subject, html, text, priority } = job.data;
    
    try {
      console.log(`📧 Processing ${type} email to ${to}...`);
      
      // Rate limiting check
      await checkRateLimit(type, to);
      
      const resend = ResendService.getInstance();
      
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [to],
        subject,
        html,
        text,
        // Add tags for tracking
        tags: [
          { name: 'type', value: type },
          { name: 'environment', value: process.env.NODE_ENV || 'development' }
        ],
      });

      if (result.error) {
        throw new Error(`Resend error: ${result.error.message}`);
      }

      console.log(`✅ Email sent successfully: ${result.data?.id}`);
      
      // Update success metrics
      await updateEmailMetrics(type, 'success');
      
      return {
        success: true,
        messageId: result.data?.id,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error(`❌ Email processing failed for ${to}:`, error);
      
      // Update failure metrics
      await updateEmailMetrics(type, 'failure');
      
      throw error; // Re-throw for BullMQ retry mechanism
    }
  },
  {
    connection: redis,
    // Concurrency settings for optimal performance
    concurrency: 5, // Process 5 emails simultaneously
    limiter: {
      max: 20, // Maximum 20 jobs per duration
      duration: 60000, // 1 minute
    },
  }
);

// Rate limiting implementation
async function checkRateLimit(type: keyof typeof RATE_LIMITS, identifier: string): Promise<void> {
  const limit = RATE_LIMITS[type];
  if (!limit) return;
  
  const key = `rate_limit:${type}:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, Math.ceil(limit.duration / 1000));
  }
  
  if (current > limit.max) {
    throw new Error(`Rate limit exceeded for ${type}: ${current}/${limit.max} in ${limit.duration}ms`);
  }
}

// Metrics tracking
async function updateEmailMetrics(type: string, status: 'success' | 'failure'): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `email_metrics:${today}:${type}:${status}`;
  
  await redis.incr(key);
  await redis.expire(key, 86400 * 7); // Keep for 7 days
}

// High-level email sending functions
export async function queueTeamInviteEmail(data: {
  to: string;
  teamName: string;
  inviterName: string;
  inviteUrl: string;
  recipientName?: string;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const html = generateOptimizedInviteHTML(data);
    const text = generateOptimizedInviteText(data);
    
    const job = await emailQueue.add(
      'team-invite',
      {
        type: 'team-invite',
        to: data.to,
        subject: `You're invited to join ${data.teamName} on Nesternity`,
        html,
        text,
        priority: 1, // High priority for invites
      },
      {
        // Immediate processing for invites
        delay: 0,
        priority: 1,
      }
    );

    return { success: true, jobId: job.id };
    
  } catch (error) {
    console.error('❌ Failed to queue team invite email:', error);
    return { success: false, error: 'Failed to queue email' };
  }
}

export async function queuePasswordResetEmail(data: {
  to: string;
  resetUrl: string;
  recipientName?: string;
  expiresAt: string;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const html = generateOptimizedPasswordResetHTML(data);
    const text = generateOptimizedPasswordResetText(data);
    
    const job = await emailQueue.add(
      'password-reset',
      {
        type: 'password-reset',
        to: data.to,
        subject: 'Reset your password - Nesternity',
        html,
        text,
        priority: 1, // High priority for security emails
      },
      {
        delay: 0,
        priority: 1,
      }
    );

    return { success: true, jobId: job.id };
    
  } catch (error) {
    console.error('❌ Failed to queue password reset email:', error);
    return { success: false, error: 'Failed to queue email' };
  }
}

// Optimized, lightweight email templates
function generateOptimizedInviteHTML(data: {
  teamName: string;
  inviterName: string;
  inviteUrl: string;
  recipientName?: string;
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Team Invitation</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5"><div style="background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 4px rgba(0,0,0,0.1)"><div style="text-align:center;margin-bottom:30px"><div style="font-size:24px;font-weight:bold;color:#6366f1;margin-bottom:10px">🚀 Nesternity</div><h1>You're Invited!</h1></div><p>Hi ${data.recipientName || 'there'},</p><p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.teamName}</strong> on Nesternity.</p><div style="text-align:center;margin:30px 0"><a href="${data.inviteUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500">Accept Invitation</a></div><p style="font-size:14px;color:#666;margin-top:30px;padding-top:20px;border-top:1px solid #e5e5e5">If the button doesn't work, visit: <a href="${data.inviteUrl}">${data.inviteUrl}</a></p></div></body></html>`;
}

function generateOptimizedInviteText(data: {
  teamName: string;
  inviterName: string;
  inviteUrl: string;
  recipientName?: string;
}): string {
  return `🚀 Nesternity - Team Invitation\n\nHi ${data.recipientName || 'there'},\n\n${data.inviterName} has invited you to join "${data.teamName}" on Nesternity.\n\nAccept your invitation: ${data.inviteUrl}\n\nBest regards,\nThe Nesternity Team`;
}

function generateOptimizedPasswordResetHTML(data: {
  resetUrl: string;
  recipientName?: string;
  expiresAt: string;
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset Password</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5"><div style="background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 4px rgba(0,0,0,0.1)"><div style="text-align:center;margin-bottom:30px"><div style="font-size:24px;font-weight:bold;color:#6366f1;margin-bottom:10px">🚀 Nesternity</div><h1>Reset Your Password</h1></div><p>Hi ${data.recipientName || 'there'},</p><p>We received a request to reset your password. Click the button below to reset it:</p><div style="text-align:center;margin:30px 0"><a href="${data.resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500">Reset Password</a></div><p style="color:#dc2626;font-size:14px">This link expires on ${new Date(data.expiresAt).toLocaleString()}</p><p style="font-size:14px;color:#666;margin-top:30px;padding-top:20px;border-top:1px solid #e5e5e5">If you didn't request this, ignore this email.</p></div></body></html>`;
}

function generateOptimizedPasswordResetText(data: {
  resetUrl: string;
  recipientName?: string;
  expiresAt: string;
}): string {
  return `🚀 Nesternity - Password Reset\n\nHi ${data.recipientName || 'there'},\n\nWe received a request to reset your password.\n\nReset your password: ${data.resetUrl}\n\nThis link expires on ${new Date(data.expiresAt).toLocaleString()}\n\nIf you didn't request this, ignore this email.\n\nBest regards,\nThe Nesternity Team`;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down email worker...');
  await emailWorker.close();
  await emailQueue.close();
  console.log('✅ Email worker shut down gracefully');
  process.exit(0);
});