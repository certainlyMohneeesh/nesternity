import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Database statistics
    const dbStats = await Promise.all([
      db.user.count(),
      db.team.count(),
      db.teamInvite.count({ where: { usedAt: null } }),
      db.activity.count()
    ]).then(([users, teams, activeInvites, activities]) => ({
      users,
      teams,
      activeInvites,
      activities
    }));

    // System information
    const systemInfo = {
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      uptime: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
      timestamp: new Date().toISOString()
    };

    // Mock recent errors (in a real app, you'd store these in a logging system)
    const recentErrors = [
      {
        message: "Example error: Database connection timeout",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        stack: "Error: Database connection timeout\n    at Connection.connect (/app/lib/db.js:45:12)\n    at async handler (/app/api/profile/route.js:12:5)"
      },
      {
        message: "Warning: Slow query detected",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        stack: null
      }
    ];

    // API status
    const apiStatus = {
      endpoints: [
        { path: '/api/profile', status: 'healthy' },
        { path: '/api/teams', status: 'healthy' },
        { path: '/api/invites', status: 'healthy' },
        { path: '/api/activities', status: 'healthy' }
      ],
      lastCheck: new Date().toISOString()
    };

    return NextResponse.json({
      dbStats,
      systemInfo,
      recentErrors,
      apiStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to load troubleshooting data',
      details: error.message
    }, { status: 500 });
  }
}
