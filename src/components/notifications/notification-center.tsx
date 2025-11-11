"use client";
import { useEffect, useState } from "react";
import { 
  Bell, 
  Check, 
  CheckCircle, 
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
  Sparkles,
  Inbox
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
  const [hasLoadedCount, setHasLoadedCount] = useState(false);

  // Fetch unread count only once on mount
  useEffect(() => {
    if (session?.user && !hasLoadedCount) {
      fetchUnreadCount();
      setHasLoadedCount(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Fetch notifications when sheet opens
  useEffect(() => {
    if (session?.user && open) {
      fetchNotifications();
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

  async function handleMarkAsRead(activityId: string) {
    await markNotificationAsRead(activityId);
    // Remove the notification from the list
    setNotifications(prev => prev.filter(n => n.activity_id !== activityId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function handleMarkAllAsRead() {
    if (!session?.user) return;
    await markAllNotificationsAsRead();
    // Remove all notifications from the list
    setNotifications([]);
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
    const iconClass = "h-4 w-4";
    
    switch (actionType) {
      // Tasks
      case 'task_created':
      case 'task_updated':
        return <FileText className={iconClass} />;
      case 'task_assigned':
        return <UserPlus className={iconClass} />;
      case 'task_completed':
        return <CheckCircle className={cn(iconClass, "text-green-600")} />;
      case 'task_moved':
        return <RefreshCw className={iconClass} />;
      
      // Team & Invites
      case 'member_added':
      case 'invite_accepted':
        return <Users className={cn(iconClass, "text-blue-600")} />;
      case 'invite_sent':
        return <MailPlus className={cn(iconClass, "text-blue-500")} />;
      case 'invite_cancelled':
        return <X className={cn(iconClass, "text-gray-500")} />;
      
      // Boards
      case 'board_created':
      case 'board_updated':
        return <LayoutDashboard className={iconClass} />;
      case 'team_updated':
        return <Settings className={iconClass} />;
      
      // Invoices
      case 'invoice_created':
        return <Receipt className={iconClass} />;
      case 'invoice_sent':
        return <Send className={cn(iconClass, "text-blue-600")} />;
      case 'invoice_paid':
        return <DollarSign className={cn(iconClass, "text-green-600")} />;
      case 'invoice_overdue':
        return <Clock className={cn(iconClass, "text-red-600")} />;
      case 'recurring_invoice_generated':
        return <RefreshCw className={cn(iconClass, "text-blue-600")} />;
      case 'recurring_invoice_failed':
        return <AlertCircle className={cn(iconClass, "text-red-600")} />;
      
      // Proposals
      case 'proposal_sent':
        return <Send className={cn(iconClass, "text-purple-600")} />;
      case 'proposal_viewed':
        return <Eye className={cn(iconClass, "text-blue-600")} />;
      case 'proposal_accepted':
        return <PartyPopper className={cn(iconClass, "text-green-600")} />;
      case 'proposal_rejected':
        return <X className={cn(iconClass, "text-red-600")} />;
      case 'proposal_signed':
        return <FileCheck className={cn(iconClass, "text-green-600")} />;
      
      // Scope Sentinel
      case 'scope_creep_detected':
        return <Search className={cn(iconClass, "text-orange-600")} />;
      case 'budget_warning':
        return <AlertTriangle className={cn(iconClass, "text-yellow-600")} />;
      case 'budget_exceeded':
        return <AlertCircle className={cn(iconClass, "text-red-600")} />;
      case 'change_order_required':
        return <FileEdit className={cn(iconClass, "text-orange-600")} />;
      
      default:
        return <Bell className={iconClass} />;
    }
  }

  function getNotificationStyle(actionType: string): {
    bgClass: string;
    borderClass: string;
    iconBgClass: string;
  } {
    switch (actionType) {
      // Success states
      case 'invoice_paid':
      case 'proposal_accepted':
      case 'proposal_signed':
      case 'task_completed':
        return {
          bgClass: 'bg-green-50/50 dark:bg-green-950/20',
          borderClass: 'border-green-200 dark:border-green-800',
          iconBgClass: 'bg-green-100 dark:bg-green-900/30'
        };
      
      // Error states
      case 'invoice_overdue':
      case 'budget_exceeded':
      case 'recurring_invoice_failed':
      case 'proposal_rejected':
        return {
          bgClass: 'bg-red-50/50 dark:bg-red-950/20',
          borderClass: 'border-red-200 dark:border-red-800',
          iconBgClass: 'bg-red-100 dark:bg-red-900/30'
        };
      
      // Warning states
      case 'budget_warning':
      case 'scope_creep_detected':
      case 'change_order_required':
        return {
          bgClass: 'bg-yellow-50/50 dark:bg-yellow-950/20',
          borderClass: 'border-yellow-200 dark:border-yellow-800',
          iconBgClass: 'bg-yellow-100 dark:bg-yellow-900/30'
        };
      
      // Info states
      case 'proposal_viewed':
      case 'recurring_invoice_generated':
      case 'invoice_sent':
      case 'proposal_sent':
      case 'invite_sent':
        return {
          bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
          borderClass: 'border-blue-200 dark:border-blue-800',
          iconBgClass: 'bg-blue-100 dark:bg-blue-900/30'
        };
      
      // Default
      default:
        return {
          bgClass: 'bg-gray-50/50 dark:bg-gray-900/20',
          borderClass: 'border-gray-200 dark:border-gray-700',
          iconBgClass: 'bg-gray-100 dark:bg-gray-800/30'
        };
    }
  }

  if (!session?.user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-accent"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full px-1 flex items-center justify-center text-xs font-semibold shadow-sm"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-semibold">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-3 max-w-[280px]">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  We'll notify you when something important happens
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-4 py-3 space-y-2">
              {notifications.map((notification, index) => {
                const activity = notification.activities;
                const isUnread = !notification.read_at;
                const style = getNotificationStyle(activity?.action_type || '');
                
                return (
                  <div key={notification.id}>
                    <div
                      className={cn(
                        "group relative p-4 rounded-lg border transition-all duration-200",
                        "hover:shadow-sm",
                        isUnread ? "cursor-pointer" : "",
                        isUnread 
                          ? cn(style.bgClass, style.borderClass)
                          : "bg-background border-border hover:bg-accent/50"
                      )}
                      onClick={() => {
                        if (isUnread) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                          isUnread ? style.iconBgClass : "bg-muted"
                        )}>
                          {getActivityIcon(activity?.action_type || '')}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm leading-snug",
                              isUnread ? "font-semibold" : "font-medium text-muted-foreground"
                            )}>
                              {activity?.title}
                            </p>
                            {isUnread && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {activity?.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {activity.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 pt-1">
                            <p className="text-xs text-muted-foreground">
                              {activity?.users?.display_name || activity?.users?.email || 'System'}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {index < notifications.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-6 py-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
