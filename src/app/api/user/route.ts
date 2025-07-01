import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('User info check - Token present:', !!token, 'Token length:', token?.length || 0);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('User info - User:', user, 'Error:', authError);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata
      }
    });
  } catch (error) {
    console.error('User info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
