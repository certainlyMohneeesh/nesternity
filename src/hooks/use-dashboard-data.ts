import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DashboardData {
  teams: Array<{
    id: string;
    name: string;
    description?: string;
    _count: {
      members: number;
      boards: number;
    };
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: string | null;
    status: string;
    archived: boolean;
    list: {
      name: string;
      board: {
        name: string;
        team: {
          name: string;
        };
      };
    };
  }>;
  recentCompletedTasks: Array<{
    id: string;
    title: string;
    priority: string;
    completedAt: string;
    list: {
      name: string;
      board: {
        name: string;
        team: {
          name: string;
        };
      };
    };
  }>;
  recurringInvoices: Array<{
    id: string;
    invoiceNumber: string;
    recurrence: string;
    nextIssueDate: Date;
    autoGenerateEnabled: boolean;
    autoSendEnabled: boolean;
    occurrenceCount: number;
    maxOccurrences: number | null;
    currency: string;
    taxRate: number;
    discount: number;
    client: {
      id: string;
      name: string;
      company: string | null;
    };
    items: Array<{
      total: number;
    }>;
  }>;
  clients: Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
    budget: number | null;
    projects: Array<{
      id: string;
      name: string;
    }>;
  }>;
  stats: {
    totalTeams: number;
    totalBoards: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
  };
}

// Query Keys
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  overview: (userId: string, organisationId?: string, projectId?: string) => {
    const key = [...dashboardQueryKeys.all, 'overview', userId];
    if (organisationId) key.push(organisationId);
    if (projectId) key.push(projectId);
    return key;
  },
} as const;

interface UseDashboardDataParams {
  userId: string | undefined;
  organisationId?: string;
  projectId?: string;
  enabled?: boolean;
}

// Custom Hook for Dashboard Data
export function useDashboardData({ userId, organisationId, projectId, enabled = true }: UseDashboardDataParams) {
  return useQuery({
    queryKey: dashboardQueryKeys.overview(userId || '', organisationId, projectId),
    queryFn: async (): Promise<DashboardData> => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('Making API call with:', { userId, organisationId, projectId });
      
      // Build query params
      const params = new URLSearchParams();
      if (organisationId) params.append('organisationId', organisationId);
      if (projectId) params.append('projectId', projectId);
      const queryString = params.toString();
      
      const res = await fetch(`/api/dashboard${queryString ? `?${queryString}` : ''}`, {
        headers: { "x-user-id": userId },
      });
      
      console.log('API response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error response:', errorText);
        throw new Error("Failed to fetch dashboard data");
      }
      
      const dashboardData = await res.json();
      console.log('Dashboard data received - teams:', dashboardData.teams?.length || 0);
      return dashboardData;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Prevent refetching on tab switch
    refetchOnMount: false, // Don't refetch if data exists and isn't stale
  });
}
