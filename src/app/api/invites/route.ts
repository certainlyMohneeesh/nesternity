import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { SendMailClient } from 'zeptomail';
import { createInviteReceivedNotification } from '@/lib/notifications';

// ZeptoMail Configuration
const ZEPTOMAIL_URL: string = process.env.ZEPTOMAIL_URL || 'https://api.zeptomail.in/v1.1/email';
const ZEPTOMAIL_TOKEN: string = process.env.ZEPTOMAIL_TOKEN || '';
const FROM_EMAIL: string = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@cyth.dev';
const FROM_NAME: string = process.env.ZEPTOMAIL_FROM_NAME || 'Nesternity';

// Initialize ZeptoMail client
let zeptoClient: SendMailClient | null = null;

function getZeptoClient(): SendMailClient {
  if (!zeptoClient) {
    if (!ZEPTOMAIL_TOKEN) {
      throw new Error('ZEPTOMAIL_TOKEN is not configured');
    }
    zeptoClient = new SendMailClient({ url: ZEPTOMAIL_URL, token: ZEPTOMAIL_TOKEN });
  }
  return zeptoClient;
}

// Get team invites
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    // Check if user has access to this team
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id, role: 'admin' } } }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    const invites = await db.teamInvite.findMany({
      where: { teamId },
      include: {
        inviter: {
          select: { email: true, displayName: true }
        },
        team: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('Get invites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create team invite
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, email, role = 'member' } = await request.json();

    if (!teamId || !email) {
      return NextResponse.json({ error: 'Team ID and email required' }, { status: 400 });
    }

    // Check if user can invite to this team
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id, role: 'admin' } } }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await db.teamMember.findFirst({
      where: {
        teamId,
        user: { email }
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
    }

    // Check if invite already exists
    const existingInvite = await db.teamInvite.findFirst({
      where: { teamId, email, usedAt: null }
    });

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 400 });
    }

    // Create invite
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invite = await db.teamInvite.create({
      data: {
        teamId,
        email,
        role,
        token,
        invitedBy: user.id,
        expiresAt
      },
      include: {
        team: { select: { name: true } },
        inviter: { select: { email: true, displayName: true } }
      }
    });

    // Send email invite
    try {
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
      
      if (ZEPTOMAIL_TOKEN) {
        const zeptoClient = getZeptoClient();
        await zeptoClient.sendMail({
          from: {
            address: FROM_EMAIL,
            name: FROM_NAME,
          },
          to: [
            {
              email_address: {
                address: email,
                name: email,
              },
            },
          ],
          subject: `You're invited to join ${team.name}`,
          htmlbody: `
          <h2>Team Invitation</h2>
          <p>You've been invited to join <strong>${team.name}</strong> by ${invite.inviter.displayName || invite.inviter.email}.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${inviteUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
          <p>This invitation expires in 7 days.</p>
          <p>If you don't have an account, you'll be able to create one when you accept the invitation.</p>
        `,
        });
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the invite creation if email fails
    }

    // Log activity
    await db.activity.create({
      data: {
        teamId,
        userId: user.id,
        type: 'INVITE_SENT',
        title: `Invited ${email} to join the team`,
        details: { email, role }
      }
    });

    // Create notification for the invited user (if they exist in the system)
    // This appears in their inbox with a direct link to accept
    await createInviteReceivedNotification(
      email,
      teamId,
      team.name,
      invite.inviter.displayName || invite.inviter.email,
      token,
      role,
    ).catch(err => console.error('Failed to create invite received notification:', err));

    return NextResponse.json({ invite });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
