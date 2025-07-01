import { NextRequest, NextResponse } from 'next/server';

// API route to check system status (server-side only)
export async function GET(request: NextRequest) {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        supabase: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
          serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing',
        },
        resend: {
          apiKey: process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing',
          fromEmail: process.env.RESEND_FROM_EMAIL || '❌ Not set',
        },
        app: {
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        }
      },
      features: {
        emailInvites: process.env.RESEND_API_KEY ? '✅ Ready (Resend)' : '❌ Not configured',
        supabaseAuth: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Ready (Optional)' : '⚠️ Optional',
        database: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Ready' : '❌ Not configured',
      }
    };

    return NextResponse.json(status);

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}
