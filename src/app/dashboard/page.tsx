"use client";

import { useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useSession } from "@/components/auth/session-context";
import { toast } from "sonner";
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Plus,
  ArrowRight,
  FolderKanban,
  Target
} from "lucide-react";

// React Query hook
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function DashboardOverview() {
  const { session, loading: sessionLoading } = useSession();
  
  // React Query hook for dashboard data with intelligent caching
  const {
    data,
    isLoading,
    error,
    refetch: fetchDashboardData
  } = useDashboardData(session?.user?.id, !!session && !sessionLoading);

  // Handle errors
  if (error) {
    console.error('Dashboard fetch error:', error);
    toast.error("Failed to load dashboard data");
  }

  // Memoize derived data
  const recentTasks = useMemo(() => data?.recentTasks || [], [data]);
  const recentCompletedTasks = useMemo(() => data?.recentCompletedTasks || [], [data]);
  const stats = useMemo(() => data?.stats || {}, [data]);

  if (sessionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] w-full">
        <div className="w-full max-w-7xl px-4 space-y-8">
          {/* Header skeleton */}
          <div className="animate-pulse h-10 bg-muted rounded mb-6 w-1/3" />
          {/* Stats skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {/* Teams and Recent Activity skeleton */}
          <div className="grid gap-8 md:grid-cols-2 mb-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-56 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {/* Recent Completed Tasks skeleton */}
          <div className="h-40 bg-muted rounded animate-pulse mb-8" />
          {/* Quick Actions skeleton */}
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-muted-foreground">Please log in to view your dashboard</div>
        <Link href="/auth/login">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Failed to load dashboard data</div>
      </div>
    );
  }

  // Empty state - no teams
  if (data.teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Welcome to Nesternity!</h2>
          <p className="text-muted-foreground">Get started by creating your first team</p>
        </div>
        <Link href="/dashboard/teams">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Team
          </Button>
        </Link>
      </div>
    );
  }

  const completionRate = data.stats.totalTasks > 0 
    ? Math.round((data.stats.completedTasks / data.stats.totalTasks) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your teams and projects.
        </p>
      </div>
         {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/dashboard/teams">
                  <Button variant="outline" className="w-full justify-start gap-2 h-auto p-4">
                    <Users className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Manage Teams</div>
                      <div className="text-xs text-muted-foreground">Create or join teams</div>
                    </div>
                  </Button>
                </Link>
                
                {data.teams.length > 0 && (
                  <Link href={`/dashboard/teams/${data.teams[0].id}/boards`}>
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto p-4">
                      <FolderKanban className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">View Boards</div>
                        <div className="text-xs text-muted-foreground">Manage your projects</div>
                      </div>
                    </Button>
                  </Link>
                )}
    
                <Button variant="outline" className="w-full justify-start gap-2 h-auto p-4" onClick={() => fetchDashboardData()}>
                  <TrendingUp className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Refresh Data</div>
                    <div className="text-xs text-muted-foreground">Update dashboard</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              Active teams
            </p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Active Boards</CardTitle>
            <FolderKanban className="h-4 w-4 text-green-600" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.stats.totalBoards}</div>
            <p className="text-xs text-muted-foreground">
              Project boards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Active Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Task completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teams and Recent Activity */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Your Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Teams</CardTitle>
              <CardDescription>Teams you're part of</CardDescription>
            </div>
            <Link href="/dashboard/teams">
              <Button variant="outline" size="sm" className="gap-2">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.teams.slice(0, 3).map((team) => (
              <div key={team.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {team.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team._count.members} members • {team._count.boards} boards
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/teams/${team.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            ))}
            {data.teams.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p>No teams yet</p>
                <Link href="/dashboard/teams">
                  <Button variant="outline" size="sm" className="mt-2">
                    Create Team
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your latest active tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTasks.length > 0 ? (
              <List
                height={200}
                itemCount={recentTasks.length}
                itemSize={56}
                width={"100%"}
              >
                {({ index, style }) => {
                  const task = recentTasks[index];
                  return (
                    <div key={task.id} style={style} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          {task.priority === 'HIGH' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                          )}
                          {task.priority === 'MEDIUM' && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                          )}
                          {task.priority === 'LOW' && (
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {task.list.board.team.name} • {task.list.board.name} • {task.list.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.dueDate && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                }}
              </List>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No recent tasks</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Completed Tasks */}
      {data.recentCompletedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Recently Completed Tasks
            </CardTitle>
            <CardDescription>Tasks you've completed recently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentCompletedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 truncate max-w-[200px]">
                      {task.title}
                    </p>
                    <p className="text-xs text-green-700">
                      {task.list.board.team.name} • {task.list.board.name} • {task.list.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {new Date(task.completedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}