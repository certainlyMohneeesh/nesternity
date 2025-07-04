import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Health check starting...');
    
    // Test database connection
    let dbStatus = false;
    let dbError = null;
    
    try {
      await testDatabaseConnection();
      dbStatus = true;
      console.log('✅ Database health check passed');
    } catch (error: any) {
      dbError = error?.message || 'Unknown database error';
      console.error('❌ Database health check failed:', error);
    }
    
    const healthData = {
      status: dbStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY_EXISTS: !!process.env.SUPABASE_ANON_KEY,
      },
      database: {
        connected: dbStatus,
        error: dbError
      }
    };
    
    console.log('🔍 Health check result:', healthData);
    
    return NextResponse.json(healthData, { 
      status: dbStatus ? 200 : 503 
    });
  } catch (error: any) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error?.message || 'Health check failed'
    }, { status: 500 });
  }
}
