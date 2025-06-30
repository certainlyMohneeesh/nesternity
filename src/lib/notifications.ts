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
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id, user_id, team_id, board_id, task_id, action_type, title, description, metadata, created_at,
      users:user_id (display_name, email)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching team activities:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    users: Array.isArray(row.users) ? row.users[0] : row.users
  }));
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
    console.error('Error fetching notifications:', error);
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
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  TASK_MOVED: 'task_moved',
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  INVITE_SENT: 'invite_sent',
  INVITE_ACCEPTED: 'invite_accepted',
  INVITE_CANCELLED: 'invite_cancelled',
  BOARD_CREATED: 'board_created',
  BOARD_UPDATED: 'board_updated',
  TEAM_UPDATED: 'team_updated',
} as const;
