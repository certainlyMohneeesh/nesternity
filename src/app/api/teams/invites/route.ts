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

    // Check for any existing invite (expired or cancelled) and delete it to avoid unique constraint
    const oldInvite = await db.teamInvite.findFirst({
      where: {
        teamId,
        email
      }
    });

    if (oldInvite) {
      // Delete the old invite to allow creating a new one (resend functionality)
      await db.teamInvite.delete({
        where: { id: oldInvite.id }
      });
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
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Join the team</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827; line-height: 1.6;">
              
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
                  <tr>
                      <td align="center" style="padding: 40px 20px;">
                          
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
                              
                              <tr>
                                  <td align="center" style="padding: 40px 40px 10px 40px;">
                                      <img src="https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/nesternity-assets/nesternity_l.png" 
                                          alt="Nesternity" 
                                          width="140" 
                                          style="display: block; width: 140px; height: auto; border: 0;">
                                  </td>
                              </tr>

                              <tr>
                                  <td style="padding: 30px 40px 40px 40px; text-align: center;">
                                      
                                      <div style="margin-bottom: 20px; font-size: 40px;">👋</div>

                                      <h1 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 700; color: #111827;">
                                          You've been invited to join <br>
                                          <span style="color: #2563eb;">${team.name}</span>
                                      </h1>
                                      
                                      <p style="margin: 0 0 25px 0; font-size: 15px; color: #4b5563;">
                                          Your teammates are using Nesternity to manage their projects and deliverables. Accept the invite to collaborate with them.
                                      </p>

                                      <div style="margin-bottom: 30px;">
                                          <a href="${inviteUrl}" 
                                            style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; border: 1px solid #111827;">
                                              Join ${team.name}
                                          </a>
                                      </div>

                                      <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                                          This invitation expires in 7 days.
                                      </p>
                                      
                                      <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: left;">
                                          <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase;">
                                              Or paste this link:
                                          </p>
                                          <p style="margin: 0; font-size: 13px; color: #6b7280; word-break: break-all; font-family: monospace; background: #f3f4f6; padding: 8px; border-radius: 4px;">
                                              ${inviteUrl}
                                          </p>
                                      </div>

                                  </td>
                              </tr>
                          </table>

                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px;">
                              <tr>
                                  <td align="center" style="padding: 24px 0;">
                                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                          © 2025 Nesternity.
                                      </p>
                                  </td>
                              </tr>
                          </table>

                      </td>
                  </tr>
              </table>
          </body>
          </html>
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

// Resend invite (refresh token and expiry)
export async function PATCH(request: NextRequest) {
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

    // Check if invite was already used
    if (invite.usedAt) {
      return NextResponse.json({ error: 'Invite has already been used' }, { status: 400 });
    }

    // Check if user has permission to resend
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

    // Generate new token and expiry
    const newToken = nanoid(32);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update invite with new token and expiry
    const updatedInvite = await db.teamInvite.update({
      where: { id: inviteId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        invitedBy: user.id // Update who resent it
      }
    });

    // Send email if Resend is configured
    let emailSent = false;
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      try {
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${newToken}`;
        
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: invite.email,
          subject: `Reminder: You're invited to join ${invite.team.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reminder: You're invited to join ${invite.team.name}</h2>
              <p>This is a reminder that you've been invited to join the team "${invite.team.name}" on Nesternity CRM.</p>
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
      }
    }

    // Get user info for notification
    const inviter = await db.user.findUnique({
      where: { id: user.id },
      select: { displayName: true, email: true }
    });

    // Create notification for resent invite (for the invited user)
    await createInviteReceivedNotification(
      invite.email,
      invite.teamId,
      invite.team.name,
      inviter?.displayName || inviter?.email || 'Someone',
      newToken,
      invite.role,
      invite.team.organisationId || undefined,
    ).catch(err => console.error('Failed to create invite received notification:', err));

    return NextResponse.json({ 
      invite: {
        id: updatedInvite.id,
        email: updatedInvite.email,
        role: updatedInvite.role,
        token: updatedInvite.token,
        teamId: updatedInvite.teamId,
        createdAt: updatedInvite.createdAt.toISOString(),
        expiresAt: updatedInvite.expiresAt.toISOString(),
        status: 'pending'
      },
      emailSent,
      message: 'Invite resent successfully'
    });
  } catch (error) {
    console.error('Resend invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
