"use client";
import { useEffect, useState } from "react";
import { 
  Bell, 
  Check, 
  CheckCircle, 
  Mail,
  MailCheck,
  FileText,
  Send,
  Eye,
  PartyPopper,
  X,
  FileCheck,
  DollarSign,
  Receipt,
  Clock,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Search,
  FileEdit,
  UserPlus,
  Users,
  MailPlus,
  LayoutDashboard,
  Settings,
  Loader2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/session-context";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  type Notification 
} from "@/lib/notifications";

export default function NotificationCenter() {
  const { session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchUnreadCount();
      if (open) {
        fetchNotifications();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, open]);

  async function fetchNotifications() {
    if (!session?.user) return;
    setLoading(true);
    const data = await getUserNotifications(session.user.id);
    setNotifications(data);
    setLoading(false);
  }

  async function fetchUnreadCount() {
    if (!session?.user) return;
    const count = await getUnreadNotificationCount(session.user.id);
    setUnreadCount(count);
  }

  async function handleMarkAsRead(notificationId: string) {
    await markNotificationAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function handleMarkAllAsRead() {
    if (!session?.user) return;
    await markAllNotificationsAsRead(session.user.id);
    setNotifications(prev => 
      prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  }

  function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  function getActivityIcon(actionType: string) {
    switch (actionType) {
      // Tasks
      case 'task_created':
      case 'task_updated':
        return '📋';
      case 'task_assigned':
        return '👤';
      case 'task_completed':
        return '✅';
      case 'task_moved':
        return '🔄';
      
      // Team
      case 'member_added':
      case 'invite_accepted':
        return '👥';
      case 'invite_sent':
        return '📧';
      case 'invite_cancelled':
        return '🚫';
      
      // Boards
      case 'board_created':
      case 'board_updated':
        return '📊';
      case 'team_updated':
        return '⚙️';
      
      // Invoices
      case 'invoice_created':
        return '📄';
      case 'invoice_sent':
        return '📤';
      case 'invoice_paid':
        return '💰';
      case 'invoice_overdue':
        return '⏰';
      case 'recurring_invoice_generated':
        return '🔁';
      case 'recurring_invoice_failed':
        return '❌';
      
      // Proposals
      case 'proposal_sent':
        return '📨';
      case 'proposal_viewed':
        return '�️';
      case 'proposal_accepted':
        return '🎉';
      case 'proposal_rejected':
        return '❌';
      case 'proposal_signed':
        return '✍️';
      
      // Scope Sentinel
      case 'scope_creep_detected':
        return '🔍';
      case 'budget_warning':
        return '⚠️';
      case 'budget_exceeded':
        return '🚨';
      case 'change_order_required':
        return '📋';
      
      default:
        return '�🔔';
    }
  }

  function getNotificationColor(actionType: string): string {
    switch (actionType) {
      case 'invoice_paid':
      case 'proposal_accepted':
      case 'proposal_signed':
      case 'task_completed':
        return 'bg-green-50 border-green-200';
      
      case 'invoice_overdue':
      case 'budget_exceeded':
      case 'recurring_invoice_failed':
      case 'proposal_rejected':
        return 'bg-red-50 border-red-200';
      
      case 'budget_warning':
      case 'scope_creep_detected':
        return 'bg-yellow-50 border-yellow-200';
      
      case 'proposal_viewed':
      case 'recurring_invoice_generated':
        return 'bg-blue-50 border-blue-200';
      
      default:
        return 'bg-gray-50 border-gray-200';
    }
  }

  if (!session?.user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-80">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="space-y-2">
              {notifications.map((notification) => {
                const activity = notification.activities;
                const isUnread = !notification.read_at;
                const colorClass = isUnread 
                  ? getNotificationColor(activity?.action_type || '')
                  : 'bg-gray-50 border-gray-200';
                
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-colors ${colorClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg">
                        {getActivityIcon(activity?.action_type || '')}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {activity?.title}
                            </p>
                            {activity?.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              by {activity?.users?.display_name || activity?.users?.email || 'Unknown'}
                            </p>
                          </div>
                          
                          {isUnread && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
