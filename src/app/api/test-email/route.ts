import { NextRequest, NextResponse } from 'next/server';
import { sendTeamInviteEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Test email data
    const testEmailData = {
      recipientEmail: '2203chemicalmyth@gmail.com',
      recipientName: 'Test User',
      teamName: 'Test Team',
      inviterName: 'Demo Admin',
      inviteToken: 'test-token-123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    };

    console.log('🧪 Testing email service with data:', testEmailData);

    const result = await sendTeamInviteEmail(testEmailData);

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully!' : 'Email sending failed',
      error: result.error,
      testData: testEmailData
    });

  } catch (error) {
    console.error('❌ Test email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Test email failed' },
      { status: 500 }
    );
  }
}
