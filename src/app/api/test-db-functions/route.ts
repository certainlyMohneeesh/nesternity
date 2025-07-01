import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test the encoding by trying to generate a token
    const { data, error } = await supabase.rpc('create_team_invite_secure', {
      p_team_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_email: 'test@example.com',
      p_role: 'member'
    });

    return NextResponse.json({
      success: !error,
      error: error?.message,
      data: data,
      message: error ? 'Database function has issues' : 'Database function working correctly'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test database function',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
