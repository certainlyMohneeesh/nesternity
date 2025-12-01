"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Inbox,
  Filter,
  ExternalLink,
  ListTodo,
  Zap,
  BellRing
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/session-context";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  type Notification 
} from "@/lib/notifications";
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendPushNotification,
  formatNotificationTitle,
  isHighPriorityNotification,
  saveNotificationPreference,
  getNotificationPreference,
  shouldShowNotifications,
} from "@/lib/push-notifications";

// Notification categories for filtering
type NotificationCategory = 'all' | 'invites' | 'tasks' | 'invoices' | 'scope' | 'other';

const NOTIFICATION_CATEGORIES: { value: NotificationCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Inbox className="h-3.5 w-3.5" /> },
  { value: 'invites', label: 'Invites', icon: <MailPlus className="h-3.5 w-3.5" /> },
  { value: 'tasks', label: 'Tasks', icon: <ListTodo className="h-3.5 w-3.5" /> },
  { value: 'invoices', label: 'Invoices', icon: <Receipt className="h-3.5 w-3.5" /> },
  { value: 'scope', label: 'Scope Radar', icon: <Zap className="h-3.5 w-3.5" /> },
];

// Map action types to categories
function getNotificationCategory(actionType: string): NotificationCategory {
  if (['invite_sent', 'invite_received', 'invite_accepted', 'invite_cancelled', 'member_added'].includes(actionType)) {
    return 'invites';
  }
  if (['task_created', 'task_updated', 'task_assigned', 'task_completed', 'task_moved'].includes(actionType)) {
    return 'tasks';
  }
  if (['invoice_created', 'invoice_sent', 'invoice_paid', 'invoice_overdue', 'recurring_invoice_generated', 'recurring_invoice_failed'].includes(actionType)) {
    return 'invoices';
  }
  if (['scope_creep_detected', 'budget_warning', 'budget_exceeded', 'change_order_required'].includes(actionType)) {
    return 'scope';
  }
  return 'other';
}

// Get the route for a notification based on its type and metadata
function getNotificationRoute(notification: Notification): string | null {
  const activity = notification.activities;
  if (!activity) return null;
  
  const actionType = activity.action_type;
  const metadata = activity.metadata as Record<string, unknown> | null;
  
  // Team invites - route to join page with invite code
  if (actionType === 'invite_received' && metadata?.inviteCode) {
    return `/join?code=${metadata.inviteCode}`;
  }
  
  // Task assignments - route to team board
  if (['task_assigned', 'task_created', 'task_updated', 'task_completed', 'task_moved'].includes(actionType)) {
    if (metadata?.teamId && metadata?.boardId) {
      return `/dashboard/teams/${metadata.teamId}/board/${metadata.boardId}`;
    }
    if (metadata?.teamId) {
      return `/dashboard/teams/${metadata.teamId}`;
    }
  }
  
  // Invoice notifications - route to invoice
  if (['invoice_created', 'invoice_sent', 'invoice_paid', 'invoice_overdue', 'recurring_invoice_generated'].includes(actionType)) {
    if (metadata?.invoiceId) {
      return `/dashboard/invoices/${metadata.invoiceId}`;
    }
    return '/dashboard/invoices';
  }
  
  // Scope radar notifications - route to scope sentinel
  if (['scope_creep_detected', 'budget_warning', 'budget_exceeded', 'change_order_required'].includes(actionType)) {
    if (metadata?.projectId) {
      return `/dashboard/projects/${metadata.projectId}?tab=scope`;
    }
    return '/dashboard/scope-sentinel';
  }
  
  // Proposal notifications
  if (['proposal_sent', 'proposal_viewed', 'proposal_accepted', 'proposal_rejected', 'proposal_signed'].includes(actionType)) {
    if (metadata?.proposalId) {
      return `/dashboard/proposals/${metadata.proposalId}`;
    }
    return '/dashboard/proposals';
  }
  
  // Board notifications
  if (['board_created', 'board_updated'].includes(actionType)) {
    if (metadata?.teamId && metadata?.boardId) {
      return `/dashboard/teams/${metadata.teamId}/board/${metadata.boardId}`;
    }
  }
  
  // Team notifications
  if (['team_updated', 'member_added', 'invite_accepted'].includes(actionType)) {
    if (metadata?.teamId) {
      return `/dashboard/teams/${metadata.teamId}`;
    }
    return '/dashboard/teams';
  }
  
  return null;
}

export default function NotificationCenter() {
  const { session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasLoadedCount, setHasLoadedCount] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');
  const [viewMode, setViewMode] = useState<'unread' | 'all'>('unread');
  
  // Push notification state
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const previousNotificationIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Check push notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const permission = getNotificationPermission();
      setPushPermission(permission);
      
      // Show permission prompt if not yet decided and preference not set
      const preference = getNotificationPreference();
      if (permission === 'default' && preference === null) {
        // Delay showing prompt to not annoy user immediately
        const timer = setTimeout(() => {
          setShowPermissionPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Request push notification permission
  async function handleRequestPermission() {
    const permission = await requestNotificationPermission();
    setPushPermission(permission);
    setShowPermissionPrompt(false);
    
    if (permission === 'granted') {
      saveNotificationPreference(true);
      // Send a test notification
      sendPushNotification({
        title: 'Notifications Enabled',
        body: 'You will now receive browser notifications for important updates.',
      });
    } else {
      saveNotificationPreference(false);
    }
  }

  // Dismiss permission prompt
  function handleDismissPermission() {
    setShowPermissionPrompt(false);
    saveNotificationPreference(false);
  }

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

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!session?.user) return;

    const pollInterval = setInterval(async () => {
      const newCount = await getUnreadNotificationCount(session.user.id);
      
      // If count increased, fetch new notifications and send push
      if (newCount > unreadCount && !isFirstLoad.current) {
        const newNotifications = await getUserNotifications(session.user.id);
        
        // Find new notifications that weren't in the previous set
        const newItems = newNotifications.filter(
          n => !previousNotificationIds.current.has(n.id) && !n.read_at
        );

        // Send push notifications for new items
        if (shouldShowNotifications() && newItems.length > 0) {
          for (const notification of newItems) {
            const activity = notification.activities;
            if (activity) {
              const route = getNotificationRoute(notification);
              sendPushNotification({
                title: formatNotificationTitle(activity.action_type, activity.title || 'New notification'),
                body: activity.description || undefined,
                tag: notification.id,
                requireInteraction: isHighPriorityNotification(activity.action_type),
                data: route ? { url: route } : undefined,
                onClick: route ? () => router.push(route) : undefined,
              });
            }
          }
        }
        
        // Update state
        setNotifications(newNotifications);
        
        // Update tracked IDs
        previousNotificationIds.current = new Set(newNotifications.map(n => n.id));
      }
      
      setUnreadCount(newCount);
      isFirstLoad.current = false;
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [session, unreadCount, router]);

  async function fetchNotifications() {
    if (!session?.user) return;
    setLoading(true);
    const data = await getUserNotifications(session.user.id);
    setNotifications(data);
    
    // Track notification IDs for push notification comparison
    previousNotificationIds.current = new Set(data.map(n => n.id));
    isFirstLoad.current = false;
    
    setLoading(false);
  }

  async function fetchUnreadCount() {
    if (!session?.user) return;
    const count = await getUnreadNotificationCount(session.user.id);
    setUnreadCount(count);
  }

  // Filter notifications based on active filter and view mode
  const filteredNotifications = notifications.filter(n => {
    const category = getNotificationCategory(n.activities?.action_type || '');
    const matchesCategory = activeFilter === 'all' || category === activeFilter;
    const matchesViewMode = viewMode === 'all' || !n.read_at;
    return matchesCategory && matchesViewMode;
  });

  // Get count per category for badges
  const getCategoryCount = useCallback((category: NotificationCategory): number => {
    if (category === 'all') {
      return notifications.filter(n => !n.read_at).length;
    }
    return notifications.filter(n => {
      const notifCategory = getNotificationCategory(n.activities?.action_type || '');
      return notifCategory === category && !n.read_at;
    }).length;
  }, [notifications]);

  async function handleMarkAsRead(activityId: string, route?: string | null) {
    await markNotificationAsRead(activityId);
    // Remove the notification from the list if viewing unread only
    if (viewMode === 'unread') {
      setNotifications(prev => prev.filter(n => n.id !== activityId));
    } else {
      // Just update the read_at timestamp
      setNotifications(prev => prev.map(n => 
        n.id === activityId ? { ...n, read_at: new Date().toISOString() } : n
      ));
    }
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Navigate to the route if provided
    if (route) {
      setOpen(false);
      router.push(route);
    }
  }

  async function handleNotificationClick(notification: Notification) {
    const route = getNotificationRoute(notification);
    const isUnread = !notification.read_at;
    
    if (isUnread) {
      await handleMarkAsRead(notification.id, route);
    } else if (route) {
      setOpen(false);
      router.push(route);
    }
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
        return <UserPlus className={cn(iconClass, "text-purple-600")} />;
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
      case 'invite_received':
        return <MailPlus className={cn(iconClass, "text-green-600")} />;
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
      
      // Actionable states (invites received, task assignments)
      case 'invite_received':
      case 'task_assigned':
        return {
          bgClass: 'bg-purple-50/50 dark:bg-purple-950/20',
          borderClass: 'border-purple-200 dark:border-purple-800',
          iconBgClass: 'bg-purple-100 dark:bg-purple-900/30'
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
    <>
      {/* Permission Prompt Tooltip */}
      {showPermissionPrompt && pushPermission === 'default' && (
        <div className="fixed top-16 right-4 md:right-8 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-background border rounded-lg shadow-lg p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <BellRing className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Enable notifications?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Get browser alerts for team invites, task assignments, and important updates.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" className="h-7 text-xs" onClick={handleRequestPermission}>
                    Enable
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleDismissPermission}>
                    Not now
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 -mt-1 -mr-1"
                onClick={handleDismissPermission}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-9 w-9 hover:bg-accent"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-[10px] font-bold shadow-sm animate-in zoom-in duration-200"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'No new notifications'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      
      <SheetContent className="w-full sm:w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-semibold">Inbox</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
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
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'unread' | 'all')} className="w-full">
              <TabsList className="w-full h-8">
                <TabsTrigger value="unread" className="flex-1 text-xs h-7">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" className="flex-1 text-xs h-7">All</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <Filter className="h-3.5 w-3.5" />
                  {activeFilter !== 'all' && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Filter by type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {NOTIFICATION_CATEGORIES.map((cat) => {
                  const count = getCategoryCount(cat.value);
                  return (
                    <DropdownMenuItem
                      key={cat.value}
                      onClick={() => setActiveFilter(cat.value)}
                      className={cn(
                        "flex items-center justify-between cursor-pointer",
                        activeFilter === cat.value && "bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {cat.icon}
                        <span className="text-sm">{cat.label}</span>
                      </div>
                      {count > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-3 max-w-[280px]">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {activeFilter !== 'all' 
                    ? `No ${NOTIFICATION_CATEGORIES.find(c => c.value === activeFilter)?.label.toLowerCase()} notifications`
                    : viewMode === 'unread' 
                      ? "You're all caught up!" 
                      : "No notifications yet"
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeFilter !== 'all'
                    ? "Try a different filter"
                    : viewMode === 'unread'
                      ? "Check back later for new updates"
                      : "We'll notify you when something important happens"
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-3 py-2 space-y-1">
              {filteredNotifications.map((notification, index) => {
                const activity = notification.activities;
                const isUnread = !notification.read_at;
                const style = getNotificationStyle(activity?.action_type || '');
                const route = getNotificationRoute(notification);
                const isActionable = !!route;
                
                return (
                  <div key={notification.id}>
                    <div
                      className={cn(
                        "group relative p-3 rounded-lg border transition-all duration-200",
                        "hover:shadow-sm",
                        isActionable ? "cursor-pointer" : isUnread ? "cursor-pointer" : "",
                        isUnread 
                          ? cn(style.bgClass, style.borderClass)
                          : "bg-background border-border hover:bg-accent/50"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={cn(
                          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                          isUnread ? style.iconBgClass : "bg-muted"
                        )}>
                          {getActivityIcon(activity?.action_type || '')}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm leading-snug",
                              isUnread ? "font-semibold" : "font-medium text-muted-foreground"
                            )}>
                              {activity?.title}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isUnread && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                              {isActionable && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                              {isUnread && (
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
                              )}
                            </div>
                          </div>
                          
                          {activity?.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {activity.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 pt-0.5">
                            <p className="text-[11px] text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                            {activity?.users?.display_name && (
                              <>
                                <span className="text-[11px] text-muted-foreground">•</span>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {activity.users.display_name}
                                </p>
                              </>
                            )}
                          </div>
                          
                          {/* Action Button for specific notification types */}
                          {isUnread && activity?.action_type === 'invite_received' && route && (
                            <div className="pt-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id, route);
                                }}
                              >
                                <UserPlus className="h-3 w-3 mr-1.5" />
                                Join Team
                              </Button>
                            </div>
                          )}
                          
                          {isUnread && activity?.action_type === 'task_assigned' && route && (
                            <div className="pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id, route);
                                }}
                              >
                                <ListTodo className="h-3 w-3 mr-1.5" />
                                View Task
                              </Button>
                            </div>
                          )}
                          
                          {isUnread && ['budget_warning', 'budget_exceeded', 'scope_creep_detected'].includes(activity?.action_type || '') && route && (
                            <div className="pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id, route);
                                }}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1.5" />
                                Review Risk
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {index < filteredNotifications.length - 1 && (
                      <div className="h-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="border-t px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              {activeFilter !== 'all' && ` in ${NOTIFICATION_CATEGORIES.find(c => c.value === activeFilter)?.label}`}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}
