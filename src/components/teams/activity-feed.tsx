"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getTeamActivities, type Activity } from "@/lib/notifications";
import { Clock, User, FileText, Users, Move, CheckCircle } from "lucide-react";

interface ActivityFeedProps {
  teamId: string;
}

export default function ActivityFeed({ teamId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function fetchActivities() {
    setLoading(true);
    const data = await getTeamActivities(teamId, 20);
    setActivities(data);
    setLoading(false);
  }

  function getActivityIcon(actionType: string) {
    switch (actionType) {
      case 'task_created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'task_updated':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'task_assigned':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'task_moved':
        return <Move className="h-4 w-4 text-orange-500" />;
      case 'member_added':
      case 'member_removed':
        return <Users className="h-4 w-4 text-indigo-500" />;
      case 'board_created':
        return <FileText className="h-4 w-4 text-emerald-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }

  function getActivityColor(actionType: string) {
    switch (actionType) {
      case 'task_created':
        return 'bg-blue-50 border-blue-200';
      case 'task_updated':
        return 'bg-yellow-50 border-yellow-200';
      case 'task_assigned':
        return 'bg-purple-50 border-purple-200';
      case 'task_completed':
        return 'bg-green-50 border-green-200';
      case 'task_moved':
        return 'bg-orange-50 border-orange-200';
      case 'member_added':
      case 'member_removed':
        return 'bg-indigo-50 border-indigo-200';
      case 'board_created':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
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

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`p-3 rounded-lg border transition-colors ${getActivityColor(activity.action_type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getActivityIcon(activity.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-muted-foreground">
                          by {activity.users?.display_name || activity.users?.email || 'Unknown'}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.action_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
