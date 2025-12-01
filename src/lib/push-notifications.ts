/**
 * Browser Push Notifications Utility
 * 
 * This module handles browser push notifications using the Web Notifications API.
 * It provides functions to request permission, check support, and send notifications.
 */

// Check if browser supports notifications
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request notification permission from user
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushNotificationSupported()) {
    console.warn('[Push Notifications] Browser does not support notifications');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push Notifications] Permission:', permission);
    return permission;
  } catch (error) {
    console.error('[Push Notifications] Error requesting permission:', error);
    return 'denied';
  }
}

// Notification options interface
export interface PushNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
  onClick?: () => void;
}

// Send a browser push notification
export function sendPushNotification(options: PushNotificationOptions): Notification | null {
  if (!isPushNotificationSupported()) {
    console.warn('[Push Notifications] Browser does not support notifications');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Push Notifications] Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/nesternity_l.png',
      badge: options.badge || '/nesternity_l.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
    });

    // Handle click event
    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    } else if (options.data?.url) {
      notification.onclick = () => {
        window.focus();
        window.location.href = options.data?.url as string;
        notification.close();
      };
    }

    // Auto-close after 5 seconds unless requireInteraction is true
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  } catch (error) {
    console.error('[Push Notifications] Error sending notification:', error);
    return null;
  }
}

// Get notification icon based on action type
export function getNotificationIcon(actionType: string): string {
  // Use different icons based on notification type
  // For now, use the app logo for all
  return '/nesternity_l.png';
}

// Map action types to notification priorities (for requireInteraction)
export function isHighPriorityNotification(actionType: string): boolean {
  const highPriority = [
    'invite_received',
    'budget_exceeded',
    'budget_warning',
    'scope_creep_detected',
    'invoice_overdue',
    'task_assigned',
  ];
  return highPriority.includes(actionType);
}

// Format notification title based on action type (clean, professional format)
export function formatNotificationTitle(actionType: string, title: string): string {
  // Return clean title without emoji prefixes - browser notifications have their own icon
  return title;
}

// Get notification tag prefix for grouping similar notifications
export function getNotificationTag(actionType: string, id: string): string {
  const prefixes: Record<string, string> = {
    invite_received: 'invite',
    task_assigned: 'task',
    budget_exceeded: 'budget',
    budget_warning: 'budget',
    scope_creep_detected: 'scope',
    invoice_paid: 'invoice',
    invoice_overdue: 'invoice',
    proposal_accepted: 'proposal',
    proposal_rejected: 'proposal',
    recurring_invoice_generated: 'invoice',
  };

  const prefix = prefixes[actionType] || 'notification';
  return `${prefix}-${id}`;
}

// Store permission preference in localStorage
export function saveNotificationPreference(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nesternity_push_notifications', enabled ? 'enabled' : 'disabled');
  }
}

// Get stored notification preference
export function getNotificationPreference(): 'enabled' | 'disabled' | null {
  if (typeof window !== 'undefined') {
    const pref = localStorage.getItem('nesternity_push_notifications');
    return pref as 'enabled' | 'disabled' | null;
  }
  return null;
}

// Check if notifications should be shown (permission granted + user preference)
export function shouldShowNotifications(): boolean {
  if (!isPushNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  
  const preference = getNotificationPreference();
  return preference !== 'disabled';
}
