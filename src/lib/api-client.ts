import { supabase } from '@/lib/supabase';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface APIClientOptions {
  baseURL?: string;
  timeout?: number;
}

class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor(options: APIClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 30000;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    let session = null;
    let retries = 3;
    
    // Try to get session with retries
    while (retries > 0 && !session) {
      const { data } = await supabase.auth.getSession();
      session = data.session;
      
      if (!session) {
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 200));
        retries--;
      }
    }
    
    if (!session?.access_token) {
      // Try to refresh the session
      const { data: refreshData, error } = await supabase.auth.refreshSession();
      if (error || !refreshData.session?.access_token) {
        throw new APIError('Not authenticated', 401);
      }
      session = refreshData.session;
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseURL}${url}`, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: response.statusText };
          }
          
          throw new APIError(
            errorData.error || `HTTP ${response.status}`,
            response.status,
            errorData
          );
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        
        return {} as T;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof APIError) {
          throw error;
        }
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError('Request timeout', 408);
        }
        
        throw new APIError(
          error instanceof Error ? error.message : 'Network error',
          0
        );
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Authentication failed', 401);
    }
  }

  async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const fullURL = searchParams ? `${url}?${searchParams}` : url;
    
    return this.request<T>(fullURL, {
      method: 'GET',
    });
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
    });
  }
}

// Create a singleton instance
export const apiClient = new APIClient();

// Convenience functions for common API operations
export const api = {
  // Teams
  getTeams: () => apiClient.get<{ teams: any[] }>('/api/teams'),
  createTeam: (data: any) => apiClient.post<{ team: any }>('/api/teams', data),
  getTeam: (teamId: string) => apiClient.get<{ team: any }>(`/api/teams/${teamId}`),
  updateTeam: (teamId: string, data: any) => apiClient.patch<{ team: any }>(`/api/teams/${teamId}`, data),
  
  // Team invites
  getTeamInvites: (teamId: string) => apiClient.get<{ invites: any[] }>(`/api/teams/${teamId}/invites`),
  sendInvite: (teamId: string, data: any) => apiClient.post<{ invite: any }>(`/api/teams/${teamId}/invites`, data),
  cancelInvite: (teamId: string, inviteId: string) => apiClient.delete(`/api/teams/${teamId}/invites/${inviteId}`),
  
  // Boards
  getBoards: (teamId: string) => apiClient.get<{ boards: any[] }>(`/api/teams/${teamId}/boards`),
  createBoard: (teamId: string, data: any) => apiClient.post<{ board: any }>(`/api/teams/${teamId}/boards`, data),
  getBoard: (teamId: string, boardId: string) => apiClient.get<{ board: any }>(`/api/teams/${teamId}/boards/${boardId}`),
  updateBoard: (teamId: string, boardId: string, data: any) => apiClient.patch<{ board: any }>(`/api/teams/${teamId}/boards/${boardId}`, data),
  archiveBoard: (teamId: string, boardId: string) => apiClient.delete(`/api/teams/${teamId}/boards/${boardId}`),
  
  // Board lists
  getLists: (teamId: string, boardId: string) => apiClient.get<{ lists: any[] }>(`/api/teams/${teamId}/boards/${boardId}/lists`),
  createList: (teamId: string, boardId: string, data: any) => apiClient.post<{ list: any }>(`/api/teams/${teamId}/boards/${boardId}/lists`, data),
  
  // Tasks
  getTasks: (teamId: string, boardId: string, params?: Record<string, string>) => 
    apiClient.get<{ tasks: any[] }>(`/api/teams/${teamId}/boards/${boardId}/tasks`, params),
  createTask: (teamId: string, boardId: string, data: any) => 
    apiClient.post<{ task: any }>(`/api/teams/${teamId}/boards/${boardId}/tasks`, data),
  updateTask: (teamId: string, boardId: string, taskId: string, data: any) => 
    apiClient.patch<{ task: any }>(`/api/teams/${teamId}/boards/${boardId}/tasks/${taskId}`, data),
  deleteTask: (teamId: string, boardId: string, taskId: string) => 
    apiClient.delete(`/api/teams/${teamId}/boards/${boardId}/tasks/${taskId}`),
};
