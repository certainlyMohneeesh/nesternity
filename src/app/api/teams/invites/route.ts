import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { nanoid } from 'nanoid';
import { createInviteNotification, createInviteReceivedNotification, ACTIVITY_TYPES } from '@/lib/notifications';

const resend = new Resend(process.env.RESEND_API_KEY);

// Get team invites
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or owner of the team
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { 
            members: { 
              some: { 
                userId: user.id, 
                role: 'admin' 
              } 
            } 
          }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get pending invites (not used and not expired)
    const invites = await db.teamInvite.findMany({
      where: {
        teamId,
        usedAt: null, // Not used yet
        expiresAt: { gt: new Date() } // Not expired
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
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, email, role = 'member' } = body;

    if (!teamId || !email) {
      return NextResponse.json({ error: 'Team ID and email are required' }, { status: 400 });
    }

    // Check if user is admin or owner of the team
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { 
            members: { 
              some: { 
                userId: user.id, 
                role: 'admin' 
              } 
            } 
          }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check if user is already a member
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        teamMembers: {
          where: { teamId }
        }
      }
    });

    if (existingUser && existingUser.teamMembers.length > 0) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
    }

    // Check if there's already a pending invite
    const existingInvite = await db.teamInvite.findFirst({
      where: {
        teamId,
        email,
        usedAt: null, // Not used yet
        expiresAt: { gt: new Date() } // Not expired
      }
    });

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already exists for this email' }, { status: 400 });
    }

    // Generate invite token
    const token_invite = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite
    const invite = await db.teamInvite.create({
      data: {
        teamId,
        email,
        role,
        token: token_invite,
        invitedBy: user.id,
        expiresAt
      }
    });

    // Send email if Resend is configured
    let emailSent = false;
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      try {
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token_invite}`;
        
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject: `You're invited to join ${team.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You're invited to join ${team.name}</h2>
              <p>You've been invited to join the team "${team.name}" on Nesternity CRM.</p>
              <p>Click the link below to accept the invitation:</p>
              <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="background-color: #f8f9fa; padding: 8px; border-radius: 4px; font-family: monospace;">${inviteUrl}</p>
              <p>This invitation will expire in 7 days.</p>
              <p>If you don't have an account yet, you'll be able to create one when accepting the invitation.</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the invite creation if email fails
      }
    }

    // Create activity
    await db.activity.create({
      data: {
        teamId,
        userId: user.id,
        type: 'MEMBER_INVITED',
        title: `Invited ${email} to join the team`,
      }
    });

    // Get inviter info for notification
    const inviter = await db.user.findUnique({
      where: { id: user.id },
      select: { displayName: true, email: true }
    });

    // Create notification
    await createInviteNotification(
      user.id,
      team.name,
      inviter?.displayName || inviter?.email || 'Someone',
      ACTIVITY_TYPES.INVITE_SENT,
      {
        teamId,
        inviteId: invite.id,
        inviteeEmail: email
      }
    ).catch(err => console.error('Failed to create invite notification:', err));

    // Create notification for the invited user (if they exist in the system)
    // This appears in their inbox with a direct link to accept
    await createInviteReceivedNotification(
      email,
      teamId,
      team.name,
      inviter?.displayName || inviter?.email || 'Someone',
      token_invite,
      role,
      team.organisationId || undefined,
    ).catch(err => console.error('Failed to create invite received notification:', err));

    return NextResponse.json({ 
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        teamId: invite.teamId,
        createdAt: invite.createdAt.toISOString(),
        expiresAt: invite.expiresAt.toISOString(),
        status: invite.usedAt ? 'used' : 'pending'
      },
      emailSent 
    });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Cancel invite
export async function DELETE(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteId } = body;

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    // Get invite and check permissions
    const invite = await db.teamInvite.findUnique({
      where: { id: inviteId },
      include: {
        team: true
      }
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Check if user has permission to cancel
    const hasPermission = invite.team.createdBy === user.id || 
      await db.teamMember.findFirst({
        where: {
          teamId: invite.teamId,
          userId: user.id,
          role: 'admin'
        }
      });

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Cancel invite by setting usedAt to current time (marks as used/cancelled)
    await db.teamInvite.update({
      where: { id: inviteId },
      data: { usedAt: new Date() }
    });

    // Get user info for notification
    const inviter = await db.user.findUnique({
      where: { id: user.id },
      select: { displayName: true, email: true }
    });

    // Create notification for cancelled invite
    await createInviteNotification(
      user.id,
      invite.team.name,
      inviter?.displayName || inviter?.email || 'Someone',
      ACTIVITY_TYPES.INVITE_CANCELLED,
      {
        teamId: invite.teamId,
        inviteId,
        inviteeEmail: invite.email
      }
    ).catch(err => console.error('Failed to create invite cancelled notification:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
