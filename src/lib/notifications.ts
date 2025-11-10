import { supabase } from './supabase';

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
}

export interface Notification {
  id: string;
  user_id: string;
  activity_id: string;
  read_at?: string;
  created_at: string;
  activities?: Activity;
}

export async function createActivity(
  teamId: string,
  actionType: string,
  title: string,
  description?: string,
  boardId?: string,
  taskId?: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; error?: string; activityId?: string }> {
  try {
    const { data, error } = await supabase.rpc('create_activity_with_notifications', {
      p_team_id: teamId,
      p_board_id: boardId,
      p_task_id: taskId,
      p_action_type: actionType,
      p_title: title,
      p_description: description,
      p_metadata: metadata
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, activityId: data };
  } catch (error) {
    return { success: false, error: 'Failed to create activity' };
  }
}

export async function getTeamActivities(
  teamId: string,
  limit: number = 50
): Promise<Activity[]> {
  try {
    // First, get activities without trying to join users
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, user_id, team_id, board_id, task_id, action_type, title, description, metadata, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activitiesError) {
      console.error('Error fetching team activities:', activitiesError);
      return [];
    }

    if (!activities || activities.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(activities.map(a => a.user_id).filter(Boolean))];
    
    if (userIds.length === 0) {
      return activities.map(activity => ({
        ...activity,
        users: undefined
      }));
    }

    // Fetch user data separately
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', userIds);

    if (usersError) {
      console.warn('Error fetching user data for activities:', usersError);
      // Return activities without user data
      return activities.map(activity => ({
        ...activity,
        users: undefined
      }));
    }

    // Create a map for quick user lookup
    const userMap = new Map(users?.map(user => [user.id, user]) || []);

    // Combine activities with user data
    return activities.map(activity => ({
      ...activity,
      users: activity.user_id ? userMap.get(activity.user_id) : undefined
    }));

  } catch (error) {
    console.error('Unexpected error fetching team activities:', error);
    return [];
  }
}

export async function getUserNotifications(
  userId?: string,
  limit: number = 50
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id, user_id, activity_id, read_at, created_at,
      activities:activity_id (
        id, user_id, team_id, board_id, task_id, action_type, title, description, metadata, created_at,
        users:user_id (display_name, email)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Notifications] Error fetching notifications:', {
      // First log the error as-is
      rawError: error,
      // Try to serialize the full error
      serialized: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      // Try common error properties
      message: error?.message || 'Unknown error',
      details: error?.details || 'No details available',
      hint: error?.hint || 'No hint available',
      code: error?.code || 'No code available',
      // Check error type
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
    });
    return [];
  }

  if (!data) {
    console.log('No notification data returned from Supabase');
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    activities: Array.isArray(row.activities) ? {
      ...row.activities[0],
      users: Array.isArray(row.activities[0]?.users) ? row.activities[0].users[0] : row.activities[0]?.users
    } : row.activities ? {
      ...row.activities,
      users: Array.isArray(row.activities.users) ? row.activities.users[0] : row.activities.users
    } : undefined
  }));
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

// Activity types
export const ACTIVITY_TYPES = {
  // Tasks
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  TASK_MOVED: 'task_moved',
  
  // Team & Members
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  INVITE_SENT: 'invite_sent',
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

    const descriptions: Record<string, string> = {
      [ACTIVITY_TYPES.INVOICE_CREATED]: `${currency === 'INR' ? '₹' : '$'}${amount.toLocaleString()} • ${clientName}`,
      [ACTIVITY_TYPES.INVOICE_SENT]: `${currency === 'INR' ? '₹' : '$'}${amount.toLocaleString()} • Email sent`,
      [ACTIVITY_TYPES.INVOICE_PAID]: `Received ${currency === 'INR' ? '₹' : '$'}${amount.toLocaleString()} from ${clientName}`,
      [ACTIVITY_TYPES.INVOICE_OVERDUE]: `${currency === 'INR' ? '₹' : '$'}${amount.toLocaleString()} • Send reminder to ${clientName}`,
      [ACTIVITY_TYPES.RECURRING_INVOICE_GENERATED]: `${currency === 'INR' ? '₹' : '$'}${amount.toLocaleString()} • Sent to ${clientName}`,
      [ACTIVITY_TYPES.RECURRING_INVOICE_FAILED]: `Check recurring invoice settings for ${clientName}`,
    };

    // Create activity via Supabase RPC
    const { data, error } = await supabase.rpc('create_simple_notification', {
      p_user_id: userId,
      p_action_type: actionType,
      p_title: titles[actionType] || 'Invoice update',
      p_description: descriptions[actionType],
      p_metadata: { ...metadata, invoiceNumber, clientName, amount, currency }
    });

    if (error) {
      console.error('Error creating invoice notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error creating invoice notification:', error);
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

    const descriptions: Record<string, string> = {
      [ACTIVITY_TYPES.PROPOSAL_SENT]: proposalTitle,
      [ACTIVITY_TYPES.PROPOSAL_VIEWED]: `"${proposalTitle}" • Click to see details`,
      [ACTIVITY_TYPES.PROPOSAL_ACCEPTED]: `"${proposalTitle}" • ${amount && currency ? `${currency === 'INR' ? '₹' : '$'}${amount.toLocaleString()}` : ''}`,
      [ACTIVITY_TYPES.PROPOSAL_REJECTED]: `"${proposalTitle}" • Follow up with client`,
      [ACTIVITY_TYPES.PROPOSAL_SIGNED]: `"${proposalTitle}" • Ready to create project`,
    };

    const { data, error } = await supabase.rpc('create_simple_notification', {
      p_user_id: userId,
      p_action_type: actionType,
      p_title: titles[actionType] || 'Proposal update',
      p_description: descriptions[actionType],
      p_metadata: { ...metadata, proposalTitle, clientName, amount, currency }
    });

    if (error) {
      console.error('Error creating proposal notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error creating proposal notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Create notification for scope sentinel alerts
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
      const currencySymbol = currency === 'INR' ? '₹' : '$';
      if (overrun > 0) {
        description = `Over budget by ${currencySymbol}${overrun.toLocaleString()} • ${currencySymbol}${current.toLocaleString()} / ${currencySymbol}${original.toLocaleString()}`;
      } else {
        const remaining = original - current;
        description = `${currencySymbol}${remaining.toLocaleString()} remaining • ${Math.round((current / original) * 100)}% spent`;
      }
    }

    const { data, error } = await supabase.rpc('create_simple_notification', {
      p_user_id: userId,
      p_action_type: actionType,
      p_title: titles[actionType] || 'Project alert',
      p_description: description,
      p_metadata: { ...metadata, projectName, riskLevel, budgetInfo }
    });

    if (error) {
      console.error('Error creating scope radar notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error creating scope radar notification:', error);
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

    const { data, error } = await supabase.rpc('create_simple_notification', {
      p_user_id: userId,
      p_action_type: actionType,
      p_title: titles[actionType] || 'Invite update',
      p_description: descriptions[actionType],
      p_metadata: { ...metadata, teamName, inviterName }
    });

    if (error) {
      console.error('Error creating invite notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error creating invite notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}
