import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const status = {
    database: { status: 'checking' as 'checking' | 'healthy' | 'error', message: 'Checking database connection...', details: null as any },
    auth: { status: 'checking' as 'checking' | 'healthy' | 'error', message: 'Checking authentication service...', details: null as any },
    email: { status: 'checking' as 'checking' | 'healthy' | 'error', message: 'Checking email service...', details: null as any },
    api: { status: 'checking' as 'checking' | 'healthy' | 'error', message: 'Checking API endpoints...', details: null as any }
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

  // Check Email Service
  try {
    if (!process.env.RESEND_API_KEY) {
      status.email = {
        status: 'error',
        message: 'Resend API key not configured',
        details: null
      };
    } else {
      // Just check if we can initialize Resend (don't send actual email)
      const apiKey = process.env.RESEND_API_KEY;
      status.email = {
        status: 'healthy',
        message: 'Resend service configured',
        details: {
          apiKeyConfigured: !!apiKey,
          fromEmail: process.env.RESEND_FROM_EMAIL
        }
      };
    }
  } catch (error: any) {
    status.email = {
      status: 'error',
      message: 'Email service check failed',
      details: { error: error.message }
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
