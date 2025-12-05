// Notification types and API client functions
// Uses Prisma (PostgreSQL) for database, not Supabase DB
// Enhanced for Notion-like Inbox functionality

import { db } from '@/lib/db';
import { getCurrencySymbol } from '@/lib/utils';

export interface Activity {
  id: string;
  user_id: string;
  team_id: string;
  board_id?: string;
  task_id?: string;
  action_type: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
  users?: {
    display_name?: string;
    email: string;
  };
  // Enhanced fields for actionable notifications
  action_url?: string;
  action_label?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  activity_id: string;
  read_at?: string;
  created_at: string;
  activities?: Activity;
}

// Notification categories for filtering
export type NotificationCategory = 
  | 'invite'
  | 'task'
  | 'invoice'
  | 'budget'
  | 'proposal'
  | 'team'
  | 'all';

export async function createActivity(
  teamId: string,
  actionType: string,
  title: string,
  description?: string,
  boardId?: string,
  taskId?: string,
  metadata: Record<string, any> = {},
  userId?: string
): Promise<{ success: boolean; error?: string; activityId?: string }> {
  try {
    // Build details object
    const activityDetails: any = { ...(metadata || {}) };
    if (description) {
      activityDetails.description = description;
    }
    if (boardId) {
      activityDetails.boardId = boardId;
    }
    if (taskId) {
      activityDetails.taskId = taskId;
    }

    // Create activity directly in database
    const activity = await db.activity.create({
      data: {
        teamId,
        userId: userId || teamId, // Fallback to teamId if userId not provided
        type: actionType,
        title,
        details: Object.keys(activityDetails).length > 0 ? activityDetails : null
      }
    });

    return { success: true, activityId: activity.id };

  } catch (error: any) {
    console.error('[Notifications] Error creating activity:', error);
    return { success: false, error: error?.message || 'Failed to create activity' };
  }
}

export async function getTeamActivities(
  teamId: string,
  limit: number = 50
): Promise<Activity[]> {
  try {
    console.log('[Notifications] Fetching team activities via API for team:', teamId);
    
    const response = await fetch(`/api/activities?teamId=${teamId}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('[Notifications] API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Transform API response to Activity format
    return (data.activities || []).map((activity: any) => ({
      id: activity.id,
      user_id: activity.userId,
      team_id: activity.teamId,
      board_id: activity.details?.boardId,
      task_id: activity.details?.taskId,
      action_type: activity.type,
      title: activity.title,
      description: activity.details?.description,
      metadata: activity.details || {},
      created_at: activity.createdAt,
      users: activity.user ? {
        display_name: activity.user.displayName,
        email: activity.user.email
      } : undefined
    }));

  } catch (error) {
    console.error('[Notifications] Unexpected error fetching team activities:', error);
    return [];
  }
}

export async function getUserNotifications(
  userId?: string,
  limit: number = 50
): Promise<Notification[]> {
  try {
    console.log('[Notifications] Fetching notifications via API');
    
    const response = await fetch(`/api/notifications?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[Notifications] API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return [];
    }

    const data = await response.json();
    console.log('[Notifications] Received notifications:', data.count);
    
    return data.notifications || [];

  } catch (error: any) {
    console.error('[Notifications] Error fetching notifications:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });
    return [];
  }
}

export async function markNotificationAsRead(
  activityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/notifications/${activityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: errorData.error || 'Failed to mark as read' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Notifications] Error marking notification as read:', error);
    return { success: false, error: error?.message || 'Failed to mark as read' };
  }
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: errorData.error || 'Failed to mark all as read' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Notifications] Error marking all notifications as read:', error);
    return { success: false, error: error?.message || 'Failed to mark all as read' };
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const response = await fetch('/api/notifications/unread-count', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('[Notifications] Error fetching unread count:', response.status);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;

  } catch (error) {
    console.error('[Notifications] Error fetching unread count:', error);
    return 0;
  }
}

// Activity types
export const ACTIVITY_TYPES = {
  // Tasks
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_ASSIGNED: 'task_assigned',
  TASK_ASSIGNED_TO_ME: 'task_assigned_to_me', // Personal notification for assignee
  TASK_COMPLETED: 'task_completed',
  TASK_MOVED: 'task_moved',
  
  // Team & Members
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  INVITE_SENT: 'invite_sent',
  INVITE_RECEIVED: 'invite_received', // NEW: Personal notification for invitee
  INVITE_ACCEPTED: 'invite_accepted',
  INVITE_CANCELLED: 'invite_cancelled',
  
  // Boards
  BOARD_CREATED: 'board_created',
  BOARD_UPDATED: 'board_updated',
  TEAM_UPDATED: 'team_updated',
  
  // Invoices & Billing
  INVOICE_CREATED: 'invoice_created',
  INVOICE_SENT: 'invoice_sent',
  INVOICE_PAID: 'invoice_paid',
  INVOICE_OVERDUE: 'invoice_overdue',
  RECURRING_INVOICE_GENERATED: 'recurring_invoice_generated',
  RECURRING_INVOICE_FAILED: 'recurring_invoice_failed',
  
  // Proposals
  PROPOSAL_SENT: 'proposal_sent',
  PROPOSAL_VIEWED: 'proposal_viewed',
  PROPOSAL_ACCEPTED: 'proposal_accepted',
  PROPOSAL_REJECTED: 'proposal_rejected',
  PROPOSAL_SIGNED: 'proposal_signed',
  
  // Scope Sentinel
  SCOPE_CREEP_DETECTED: 'scope_creep_detected',
  BUDGET_WARNING: 'budget_warning',
  BUDGET_EXCEEDED: 'budget_exceeded',
  CHANGE_ORDER_REQUIRED: 'change_order_required',
} as const;

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

/**
 * Create notification for invoice events
 */
export async function createInvoiceNotification(
  userId: string,
  actionType: ActivityType,
  invoiceNumber: string,
  clientName: string,
  amount: number,
  currency: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const titles: Record<string, string> = {
      [ACTIVITY_TYPES.INVOICE_CREATED]: `Invoice ${invoiceNumber} created`,
      [ACTIVITY_TYPES.INVOICE_SENT]: `Invoice ${invoiceNumber} sent to ${clientName}`,
      [ACTIVITY_TYPES.INVOICE_PAID]: `🎉 Invoice ${invoiceNumber} paid!`,
      [ACTIVITY_TYPES.INVOICE_OVERDUE]: `⚠️ Invoice ${invoiceNumber} is overdue`,
      [ACTIVITY_TYPES.RECURRING_INVOICE_GENERATED]: `Recurring invoice ${invoiceNumber} auto-generated`,
      [ACTIVITY_TYPES.RECURRING_INVOICE_FAILED]: `❌ Failed to generate recurring invoice`,
    };

    const currencySymbol = getCurrencySymbol(currency);
    const descriptions: Record<string, string> = {
      [ACTIVITY_TYPES.INVOICE_CREATED]: `${currencySymbol}${amount.toLocaleString()} • ${clientName}`,
      [ACTIVITY_TYPES.INVOICE_SENT]: `${currencySymbol}${amount.toLocaleString()} • Email sent`,
      [ACTIVITY_TYPES.INVOICE_PAID]: `Received ${currencySymbol}${amount.toLocaleString()} from ${clientName}`,
      [ACTIVITY_TYPES.INVOICE_OVERDUE]: `${currencySymbol}${amount.toLocaleString()} • Send reminder to ${clientName}`,
      [ACTIVITY_TYPES.RECURRING_INVOICE_GENERATED]: `${currencySymbol}${amount.toLocaleString()} • Sent to ${clientName}`,
      [ACTIVITY_TYPES.RECURRING_INVOICE_FAILED]: `Check recurring invoice settings for ${clientName}`,
    };

    // NOTE: This requires a teamId. For now, we'll log a warning if teamId is not in metadata
    // In production, you should always pass teamId when creating invoice notifications
    const teamId = metadata.teamId;
    if (!teamId) {
      console.warn('[Notifications] createInvoiceNotification called without teamId in metadata');
      return { success: false, error: 'teamId required in metadata' };
    }

    return await createActivity(
      teamId,
      actionType,
      titles[actionType] || 'Invoice update',
      descriptions[actionType],
      undefined, // boardId
      undefined, // taskId
      { ...metadata, invoiceNumber, clientName, amount, currency }
    );

  } catch (error) {
    console.error('[Notifications] Unexpected error creating invoice notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Create notification for proposal events
 */
export async function createProposalNotification(
  userId: string,
  actionType: ActivityType,
  proposalTitle: string,
  clientName: string,
  amount?: number,
  currency?: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const titles: Record<string, string> = {
      [ACTIVITY_TYPES.PROPOSAL_SENT]: `Proposal sent to ${clientName}`,
      [ACTIVITY_TYPES.PROPOSAL_VIEWED]: `${clientName} viewed your proposal`,
      [ACTIVITY_TYPES.PROPOSAL_ACCEPTED]: `🎉 ${clientName} accepted your proposal!`,
      [ACTIVITY_TYPES.PROPOSAL_REJECTED]: `${clientName} declined the proposal`,
      [ACTIVITY_TYPES.PROPOSAL_SIGNED]: `✍️ ${clientName} signed the proposal`,
    };

    const currencySymbol = currency ? getCurrencySymbol(currency) : '';
    const descriptions: Record<string, string> = {
      [ACTIVITY_TYPES.PROPOSAL_SENT]: proposalTitle,
      [ACTIVITY_TYPES.PROPOSAL_VIEWED]: `"${proposalTitle}" • Click to see details`,
      [ACTIVITY_TYPES.PROPOSAL_ACCEPTED]: `"${proposalTitle}" • ${amount && currency ? `${currencySymbol}${amount.toLocaleString()}` : ''}`,
      [ACTIVITY_TYPES.PROPOSAL_REJECTED]: `"${proposalTitle}" • Follow up with client`,
      [ACTIVITY_TYPES.PROPOSAL_SIGNED]: `"${proposalTitle}" • Ready to create project`,
    };

    const teamId = metadata.teamId;
    if (!teamId) {
      console.warn('[Notifications] createProposalNotification called without teamId in metadata');
      return { success: false, error: 'teamId required in metadata' };
    }

    return await createActivity(
      teamId,
      actionType,
      titles[actionType] || 'Proposal update',
      descriptions[actionType],
      undefined,
      undefined,
      { ...metadata, proposalTitle, clientName, amount, currency }
    );

  } catch (error) {
    console.error('[Notifications] Unexpected error creating proposal notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Create notification for scope sentinel alerts
 * IMPORTANT: Only organisation owners should receive these notifications
 */
export async function createScopeRadarNotification(
  userId: string,
  actionType: ActivityType,
  projectName: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  budgetInfo?: {
    original: number;
    current: number;
    overrun: number;
    currency: string;
  },
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // SECURITY: Verify user is the organisation owner before creating notification
    const organisationId = metadata.organisationId;
    if (organisationId) {
      const organisation = await db.organisation.findUnique({
        where: { id: organisationId },
        select: { ownerId: true }
      });
      
      if (organisation && organisation.ownerId !== userId) {
        console.log('[Notifications] Skipping scope radar notification - user is not organisation owner');
        return { success: true }; // Silent skip for non-owners
      }
    }

    const riskEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };

    const titles: Record<string, string> = {
      [ACTIVITY_TYPES.SCOPE_CREEP_DETECTED]: `${riskEmoji[riskLevel]} Scope creep detected in ${projectName}`,
      [ACTIVITY_TYPES.BUDGET_WARNING]: `⚠️ Budget warning for ${projectName}`,
      [ACTIVITY_TYPES.BUDGET_EXCEEDED]: `🚨 Budget exceeded for ${projectName}`,
      [ACTIVITY_TYPES.CHANGE_ORDER_REQUIRED]: `📋 Change order required for ${projectName}`,
    };

    let description = '';
    if (budgetInfo) {
      const { original, current, overrun, currency } = budgetInfo;
      const currencySymbol = getCurrencySymbol(currency);
      if (overrun > 0) {
        description = `Over budget by ${currencySymbol}${overrun.toLocaleString()} • ${currencySymbol}${current.toLocaleString()} / ${currencySymbol}${original.toLocaleString()}`;
      } else {
        const remaining = original - current;
        description = `${currencySymbol}${remaining.toLocaleString()} remaining • ${Math.round((current / original) * 100)}% spent`;
      }
    }

    const teamId = metadata.teamId;
    if (!teamId) {
      console.warn('[Notifications] createScopeRadarNotification called without teamId in metadata');
      return { success: false, error: 'teamId required in metadata' };
    }

    return await createActivity(
      teamId,
      actionType,
      titles[actionType] || 'Project alert',
      description,
      undefined,
      undefined,
      { ...metadata, projectName, riskLevel, budgetInfo },
      userId // Pass userId to createActivity
    );

  } catch (error) {
    console.error('[Notifications] Unexpected error creating scope radar notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Create notification for team invites
 */
export async function createInviteNotification(
  userId: string,
  teamName: string,
  inviterName: string,
  actionType: ActivityType,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const titles: Record<string, string> = {
      [ACTIVITY_TYPES.INVITE_SENT]: `Team invite sent`,
      [ACTIVITY_TYPES.INVITE_ACCEPTED]: `${inviterName} joined ${teamName}`,
      [ACTIVITY_TYPES.INVITE_CANCELLED]: `Invite cancelled`,
    };

    const descriptions: Record<string, string> = {
      [ACTIVITY_TYPES.INVITE_SENT]: `Invited to ${teamName} by ${inviterName}`,
      [ACTIVITY_TYPES.INVITE_ACCEPTED]: `Welcome to the team!`,
      [ACTIVITY_TYPES.INVITE_CANCELLED]: `Invite to ${teamName} was cancelled`,
    };

    const teamId = metadata.teamId;
    if (!teamId) {
      console.warn('[Notifications] createInviteNotification called without teamId in metadata');
      return { success: false, error: 'teamId required in metadata' };
    }

    return await createActivity(
      teamId,
      actionType,
      titles[actionType] || 'Invite update',
      descriptions[actionType],
      undefined,
      undefined,
      { ...metadata, teamName, inviterName }
    );

  } catch (error) {
    console.error('[Notifications] Unexpected error creating invite notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Create a personal notification for a specific user (not tied to team activity feed)
 * Used for: invite notifications to invitee, task assignment notifications to assignee
 */
export async function createPersonalNotification(
  targetUserId: string,
  actionType: ActivityType,
  title: string,
  description?: string,
  actionUrl?: string,
  actionLabel?: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    console.log('[Notifications] Creating personal notification for user:', targetUserId);

    // For personal notifications, we need a teamId for the Activity
    // We'll use a special system team or the team from metadata
    const teamId = metadata.teamId;
    
    if (!teamId) {
      // Try to find a team the user belongs to
      const userTeam = await db.teamMember.findFirst({
        where: { userId: targetUserId },
        select: { teamId: true },
        orderBy: { createdAt: 'asc' }
      });

      if (!userTeam) {
        // Try teams the user owns
        const ownedTeam = await db.team.findFirst({
          where: { createdBy: targetUserId },
          select: { id: true },
          orderBy: { createdAt: 'asc' }
        });

        if (!ownedTeam) {
          console.warn('[Notifications] Cannot create personal notification: user has no teams');
          return { success: false, error: 'User has no teams for notification context' };
        }
        metadata.teamId = ownedTeam.id;
      } else {
        metadata.teamId = userTeam.teamId;
      }
    }

    // Create activity with enhanced metadata
    const activityDetails: any = {
      ...(metadata || {}),
      description,
      actionUrl,
      actionLabel,
    };

    const activity = await db.activity.create({
      data: {
        teamId: metadata.teamId,
        userId: targetUserId, // The target user
        type: actionType,
        title,
        details: activityDetails
      }
    });

    // Create notification directly for the target user
    const notification = await db.notification.create({
      data: {
        userId: targetUserId,
        activityId: activity.id,
      }
    });

    console.log('[Notifications] Personal notification created:', notification.id);
    return { success: true, notificationId: notification.id };

  } catch (error: any) {
    console.error('[Notifications] Error creating personal notification:', error);
    return { success: false, error: error?.message || 'Failed to create notification' };
  }
}

/**
 * Create invite received notification for the invited user
 * This creates a direct notification that appears in the invitee's inbox
 */
export async function createInviteReceivedNotification(
  inviteeEmail: string,
  teamId: string,
  teamName: string,
  inviterName: string,
  inviteToken: string,
  role: string,
  organisationId?: string,
  projectId?: string
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    console.log('[Notifications] Creating invite received notification for:', inviteeEmail);

    // Find user by email
    const invitee = await db.user.findUnique({
      where: { email: inviteeEmail }
    });

    if (!invitee) {
      console.log('[Notifications] User not found for email:', inviteeEmail, '- will see notification when they register');
      return { success: true }; // Not an error, user will see it when they register
    }

    // Build action URL
    const actionUrl = `/invite/${inviteToken}`;
    
    return await createPersonalNotification(
      invitee.id,
      ACTIVITY_TYPES.INVITE_RECEIVED,
      `You're invited to join ${teamName}`,
      `${inviterName} invited you to join as ${role}`,
      actionUrl,
      'Accept Invite',
      {
        teamId,
        teamName,
        inviterName,
        inviteToken,
        role,
        inviteeEmail,
        organisationId,
        projectId,
      }
    );

  } catch (error: any) {
    console.error('[Notifications] Error creating invite received notification:', error);
    return { success: false, error: error?.message || 'Failed to create notification' };
  }
}

/**
 * Create task assignment notification for the assigned user
 */
export async function createTaskAssignmentNotification(
  assigneeId: string,
  assignerId: string,
  taskId: string,
  taskTitle: string,
  taskDescription: string,
  boardId: string,
  boardName: string,
  teamId: string,
  priority?: string,
  dueDate?: Date,
  organisationId?: string,
  projectId?: string
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    console.log('[Notifications] Creating task assignment notification for:', assigneeId);

    // Get assigner details
    const assigner = await db.user.findUnique({
      where: { id: assignerId },
      select: { displayName: true, email: true }
    });
    const assignerName = assigner?.displayName || assigner?.email || 'Someone';

    // Build action URL - deep link to the board
    let actionUrl = `/dashboard`;
    if (organisationId && projectId) {
      actionUrl = `/dashboard/organisation/${organisationId}/projects/${projectId}/teams/${teamId}/boards/${boardId}`;
    }

    // Build description with details
    let description = `${assignerName} assigned you to this task`;
    if (priority) {
      description += ` • ${priority} priority`;
    }
    if (dueDate) {
      description += ` • Due ${dueDate.toLocaleDateString()}`;
    }

    return await createPersonalNotification(
      assigneeId,
      ACTIVITY_TYPES.TASK_ASSIGNED_TO_ME,
      `You were assigned to: ${taskTitle}`,
      description,
      actionUrl,
      'View Task',
      {
        teamId,
        taskId,
        taskTitle,
        taskDescription,
        boardId,
        boardName,
        assignerId,
        assignerName,
        priority,
        dueDate: dueDate?.toISOString(),
        organisationId,
        projectId,
      }
    );

  } catch (error: any) {
    console.error('[Notifications] Error creating task assignment notification:', error);
    return { success: false, error: error?.message || 'Failed to create notification' };
  }
}

/**
 * Create recurring invoice notification for the invoice creator
 */
export async function createRecurringInvoiceNotification(
  userId: string,
  actionType: ActivityType,
  invoiceNumber: string,
  clientName: string,
  amount: number,
  currency: string,
  invoiceId: string,
  teamId: string,
  organisationId?: string,
  projectId?: string,
  error?: string
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    console.log('[Notifications] Creating recurring invoice notification for:', userId);

    const currencySymbol = getCurrencySymbol(currency);
    
    const isFailure = actionType === ACTIVITY_TYPES.RECURRING_INVOICE_FAILED;
    const title = isFailure
      ? `❌ Failed to generate recurring invoice`
      : `Recurring invoice ${invoiceNumber} generated`;
    
    const description = isFailure
      ? `Check recurring invoice settings for ${clientName}${error ? ` • Error: ${error}` : ''}`
      : `${currencySymbol}${amount.toLocaleString()} • ${clientName}`;

    // Build action URL
    let actionUrl = `/dashboard`;
    if (organisationId) {
      actionUrl = projectId
        ? `/dashboard/organisation/${organisationId}/projects/${projectId}/invoices`
        : `/dashboard/organisation/${organisationId}/invoices`;
    }

    return await createPersonalNotification(
      userId,
      actionType,
      title,
      description,
      actionUrl,
      isFailure ? 'Check Settings' : 'View Invoice',
      {
        teamId,
        invoiceId,
        invoiceNumber,
        clientName,
        amount,
        currency,
        organisationId,
        projectId,
        error,
      }
    );

  } catch (err: any) {
    console.error('[Notifications] Error creating recurring invoice notification:', err);
    return { success: false, error: err?.message || 'Failed to create notification' };
  }
}

/**
 * Create scope radar notification for organisation owner ONLY
 * SECURITY: Budget and scope alerts are restricted to organisation owners
 * Team members and admins should NOT receive these notifications
 */
export async function createScopeRadarNotificationForTeam(
  projectId: string,
  actionType: ActivityType,
  projectName: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  budgetInfo?: {
    original: number;
    current: number;
    overrun: number;
    currency: string;
  },
  organisationId?: string,
  scopeRadarId?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log('[Notifications] Creating scope radar notification for organisation owner only, project:', projectId);

    // Get project with organisation info to find the owner
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        team: true,
        organisation: {
          select: {
            id: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return { success: false, count: 0, error: 'Project not found' };
    }

    // SECURITY: Only notify the organisation owner
    const ownerId = project.organisation?.ownerId;
    if (!ownerId) {
      console.warn('[Notifications] No organisation owner found for project:', projectId);
      return { success: false, count: 0, error: 'Organisation owner not found' };
    }

    const riskEmoji = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' };
    
    const titles: Record<string, string> = {
      [ACTIVITY_TYPES.SCOPE_CREEP_DETECTED]: `${riskEmoji[riskLevel]} Scope creep in ${projectName}`,
      [ACTIVITY_TYPES.BUDGET_WARNING]: `⚠️ Budget warning: ${projectName}`,
      [ACTIVITY_TYPES.BUDGET_EXCEEDED]: `🚨 Budget exceeded: ${projectName}`,
      [ACTIVITY_TYPES.CHANGE_ORDER_REQUIRED]: `📋 Change order needed: ${projectName}`,
    };

    let description = '';
    if (budgetInfo) {
      const { original, current, overrun, currency } = budgetInfo;
      const currencySymbol = getCurrencySymbol(currency);
      if (overrun > 0) {
        description = `Over by ${currencySymbol}${overrun.toLocaleString()} (${Math.round((overrun / original) * 100)}%)`;
      } else {
        const remaining = original - current;
        const percentSpent = Math.round((current / original) * 100);
        description = `${currencySymbol}${remaining.toLocaleString()} remaining (${percentSpent}% spent)`;
      }
    }

    // Build action URL
    let actionUrl = `/dashboard`;
    const orgId = organisationId || project.organisation?.id;
    if (orgId) {
      actionUrl = `/dashboard/organisation/${orgId}/projects/${projectId}`;
    }

    // SECURITY: Only create notification for the organisation owner
    const result = await createPersonalNotification(
      ownerId,
      actionType,
      titles[actionType] || 'Project alert',
      description,
      actionUrl,
      'View Project',
      {
        teamId: project.teamId,
        projectId,
        projectName,
        riskLevel,
        budgetInfo,
        organisationId: orgId,
        scopeRadarId,
      }
    );

    if (result.success) {
      console.log(`[Notifications] Scope radar notification sent to organisation owner: ${ownerId}`);
      return { success: true, count: 1 };
    } else {
      return { success: false, count: 0, error: result.error };
    }

  } catch (error: any) {
    console.error('[Notifications] Error creating scope radar notification:', error);
    return { success: false, count: 0, error: error?.message || 'Failed to create notification' };
  }
}
