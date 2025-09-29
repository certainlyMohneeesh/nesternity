import { NextRequest, NextResponse } from 'next/server';
import { sendTeamInviteEmail, sendPasswordResetEmail } from '@/lib/email-smart';

export async function POST() {
  try {
    // Test email data
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    
    // Test team invite email
    const inviteResult = await sendTeamInviteEmail({
      recipientEmail: testEmail,
      recipientName: 'Test User',
      teamName: 'Test Team',
      inviterName: 'System Test',
      inviteToken: 'test-token-123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Test password reset email  
    const resetResult = await sendPasswordResetEmail({
      recipientEmail: testEmail,
      recipientName: 'Test User',
      resetToken: 'test-reset-token-123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Test emails queued successfully',
      results: {
        team_invite: inviteResult,
        password_reset: resetResult,
      },
      test_email: testEmail,
      note: 'Check your email worker logs to see processing status'
    });

  } catch (error) {
    console.error('Email queue test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to queue test emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}