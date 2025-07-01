import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // This is a development-only endpoint
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const { email } = await request.json();
    
    // Find user in database
    const user = await (db as any).user.findFirst({
      where: {
        email: {
          contains: email || 'test@example.com'
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a fake session token for testing
    const fakeToken = `fake-token-${user.id}-${Date.now()}`;

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      access_token: fakeToken,
      message: 'Development session created. Use this token for API testing.'
    });

  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
