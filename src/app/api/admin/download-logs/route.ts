import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Gather system logs and data
    const logs = {
      timestamp: new Date().toISOString(),
      system: {
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      },
      database: {
        stats: await Promise.all([
          db.user.count(),
          db.team.count(),
          db.teamMember.count(),
          db.teamInvite.count(),
          db.activity.count()
        ]).then(([users, teams, members, invites, activities]) => ({
          users,
          teams,
          members,
          invites,
          activities
        })),
        recentActivities: await db.activity.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { email: true, displayName: true } },
            team: { select: { name: true } }
          }
        })
      },
      configuration: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        fromEmail: process.env.RESEND_FROM_EMAIL
      },
      mockErrors: [
        {
          level: 'error',
          message: 'Example database connection timeout',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          stack: 'Error: Connection timeout\n    at Database.connect\n    at async handler'
        },
        {
          level: 'warning',
          message: 'Slow query detected: 2.5s',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          query: 'SELECT * FROM activities WHERE...'
        }
      ]
    };

    const logData = JSON.stringify(logs, null, 2);
    
    return new NextResponse(logData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nesternity-logs-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to generate logs',
      details: error.message
    }, { status: 500 });
  }
}
