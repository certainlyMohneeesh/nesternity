import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    // Get queue statistics
    const today = new Date().toISOString().split('T')[0];
    
    // Get email metrics
    const metrics = await Promise.all([
      redis.get(`email_metrics:${today}:team-invite:success`) || '0',
      redis.get(`email_metrics:${today}:team-invite:failure`) || '0',
      redis.get(`email_metrics:${today}:password-reset:success`) || '0',
      redis.get(`email_metrics:${today}:password-reset:failure`) || '0',
      redis.get(`email_metrics:${today}:notification:success`) || '0',
      redis.get(`email_metrics:${today}:notification:failure`) || '0',
    ]);

    // Calculate totals
    const totalSuccess = metrics.filter((_, i) => i % 2 === 0).reduce((sum, val) => sum + parseInt(val as string), 0);
    const totalFailure = metrics.filter((_, i) => i % 2 === 1).reduce((sum, val) => sum + parseInt(val as string), 0);
    const totalEmails = totalSuccess + totalFailure;
    const successRate = totalEmails > 0 ? ((totalSuccess / totalEmails) * 100).toFixed(2) : 0;

    return NextResponse.json({
      status: 'operational',
      redis_connected: true,
      today_stats: {
        total_emails: totalEmails,
        successful: totalSuccess,
        failed: totalFailure,
        success_rate: `${successRate}%`,
      },
      breakdown: {
        team_invites: {
          success: parseInt(metrics[0] as string),
          failure: parseInt(metrics[1] as string),
        },
        password_resets: {
          success: parseInt(metrics[2] as string),
          failure: parseInt(metrics[3] as string),
        },
        notifications: {
          success: parseInt(metrics[4] as string),
          failure: parseInt(metrics[5] as string),
        },
      },
    });

  } catch (error) {
    console.error('Email metrics error:', error);
    return NextResponse.json({
      status: 'error',
      redis_connected: false,
      error: 'Failed to fetch email metrics'
    }, { status: 500 });
  }
}