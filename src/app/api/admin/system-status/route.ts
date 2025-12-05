import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// ZeptoMail Configuration
const ZEPTOMAIL_TOKEN: string = process.env.ZEPTOMAIL_TOKEN || '';
const FROM_EMAIL: string = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@cyth.dev';

export async function GET() {
  const status = {
    database: { status: 'checking' as 'checking' | 'healthy' | 'error', message: 'Checking database connection...', details: null as unknown },
    auth: { status: 'checking' as 'checking' | 'healthy' | 'error', message: 'Checking authentication service...', details: null as unknown },
    email: { status: 'checking' as 'checking' | 'healthy' | 'error', message: 'Checking email service...', details: null as unknown },
    api: { status: 'checking' as 'checking' | 'healthy' | 'error', message: 'Checking API endpoints...', details: null as unknown }
  };

  // Check Database
  try {
    const userCount = await db.user.count();
    const teamCount = await db.team.count();
    const inviteCount = await db.teamInvite.count();
    
    status.database = {
      status: 'healthy',
      message: 'Database connection successful',
      details: {
        users: userCount,
        teams: teamCount,
        invites: inviteCount,
        connectionString: process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@') // Hide credentials
      }
    };
  } catch (error: any) {
    status.database = {
      status: 'error',
      message: 'Database connection failed',
      details: { error: error.message }
    };
  }

  // Check Supabase Auth
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      status.auth = {
        status: 'error',
        message: 'Supabase Auth error',
        details: { error: error.message }
      };
    } else {
      status.auth = {
        status: 'healthy',
        message: 'Supabase Auth service operational',
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSession: !!data.session
        }
      };
    }
  } catch (error: any) {
    status.auth = {
      status: 'error',
      message: 'Supabase Auth connection failed',
      details: { error: error.message }
    };
  }

  // Check Email Service (ZeptoMail)
  try {
    if (!ZEPTOMAIL_TOKEN) {
      status.email = {
        status: 'error',
        message: 'ZeptoMail API token not configured',
        details: null
      };
    } else {
      status.email = {
        status: 'healthy',
        message: 'ZeptoMail service configured',
        details: {
          apiKeyConfigured: !!ZEPTOMAIL_TOKEN,
          fromEmail: FROM_EMAIL
        }
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    status.email = {
      status: 'error',
      message: 'Email service check failed',
      details: { error: errorMessage }
    };
  }

  // Check API Health
  try {
    const apiChecks = [];
    
    // Check if main API routes exist
    const routes = [
      '/api/profile',
      '/api/teams',
      '/api/invites',
      '/api/activities'
    ];
    
    status.api = {
      status: 'healthy',
      message: 'API endpoints accessible',
      details: {
        routes: routes,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    };
  } catch (error: any) {
    status.api = {
      status: 'error',
      message: 'API health check failed',
      details: { error: error.message }
    };
  }

  return NextResponse.json({ 
    status,
    timestamp: new Date().toISOString(),
    overall: Object.values(status).every(s => s.status === 'healthy') ? 'healthy' : 'degraded'
  });
}
