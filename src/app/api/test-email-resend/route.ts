import { NextRequest, NextResponse } from 'next/server';
import { sendTeamInviteEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email = 'test@example.com' } = body;

    // Send test email with sample data
    const result = await sendTeamInviteEmail({
      recipientEmail: email,
      recipientName: 'Test User',
      teamName: 'Test Team',
      inviterName: 'Your Test',
      inviteToken: 'test-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    return NextResponse.json({
      success: result.success,
      error: result.error,
      message: result.success ? 'Test email sent successfully!' : 'Test email failed'
    });

  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
