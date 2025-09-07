import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, APIError } from '@/lib/api-client';
import { toast } from 'sonner';

// Types
interface List {
  id: string;
  name: string;
  position: number;
  color?: string;
  _count: {
    tasks: number;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  listId: string;
  assignedTo: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  position: number;
  assignee?: { 
    displayName: string; 
    id: string; 
    email: string;
  };
  list: {
    id: string;
    name: string;
    color?: string;
  };
}

interface TeamMember {
  id: string;
  userId: string;
  user: { 
    displayName: string; 
    id: string; 
    email: string;
  };
}

// Query Keys
export const boardQueryKeys = {
  all: ['board'] as const,
  board: (teamId: string, boardId: string) => [...boardQueryKeys.all, 'details', teamId, boardId] as const,
  lists: (teamId: string, boardId: string) => [...boardQueryKeys.all, 'lists', teamId, boardId] as const,
  tasks: (teamId: string, boardId: string) => [...boardQueryKeys.all, 'tasks', teamId, boardId] as const,
  teamMembers: (teamId: string) => [...boardQueryKeys.all, 'team-members', teamId] as const,
} as const;

// Custom Hooks
export function useBoardDetails(teamId: string, boardId: string, enabled = true) {
  return useQuery({
    queryKey: boardQueryKeys.board(teamId, boardId),
    queryFn: async () => {
      const response = await api.getBoard(teamId, boardId);
      return response.board;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes (board details change less frequently)
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
}

export function useBoardLists(teamId: string, boardId: string, enabled = true) {
  return useQuery({
    queryKey: boardQueryKeys.lists(teamId, boardId),
    queryFn: async () => {
      const response = await api.getLists(teamId, boardId);
      return response.lists || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useBoardTasks(teamId: string, boardId: string, enabled = true) {
  return useQuery({
    queryKey: boardQueryKeys.tasks(teamId, boardId),
    queryFn: async () => {
      const response = await api.getTasks(teamId, boardId);
      return response.tasks || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTeamMembers(teamId: string, enabled = true) {
  return useQuery({
    queryKey: boardQueryKeys.teamMembers(teamId),
    queryFn: async () => {
      const response = await api.getTeam(teamId);
      return response.team.members || [];
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes (team members change less frequently)
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
}

// Mutations
export function useCreateTask(teamId: string, boardId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: {
      title: string;
      description: string;
      listId: string;
      assignedTo: string | null;
      priority: string;
      dueDate: string | null;
    }) => {
      const response = await api.createTask(teamId, boardId, taskData);
      return response.task;
    },
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: boardQueryKeys.tasks(teamId, boardId) });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(boardQueryKeys.tasks(teamId, boardId));
      
      // Optimistically update to the new value
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: newTask.title,
        description: newTask.description,
        listId: newTask.listId,
        assignedTo: newTask.assignedTo,
        status: "TODO",
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        position: previousTasks?.filter(t => t.listId === newTask.listId).length || 0,
        list: { id: newTask.listId, name: '' },
      };
      
      queryClient.setQueryData<Task[]>(
        boardQueryKeys.tasks(teamId, boardId),
        (old) => [...(old || []), optimisticTask]
      );
      
      return { previousTasks, optimisticTask };
    },
    onError: (err, newTask, context) => {
      // Revert to previous state on error
      if (context?.previousTasks) {
        queryClient.setQueryData(boardQueryKeys.tasks(teamId, boardId), context.previousTasks);
      }
      toast.error(err instanceof APIError ? err.message : "Failed to create task");
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic task with real task
      queryClient.setQueryData<Task[]>(
        boardQueryKeys.tasks(teamId, boardId),
        (old) => old?.map(task => 
          task.id === context?.optimisticTask.id ? data : task
        ) || []
      );
      toast.success("Task created successfully");
    },
  });
}

export function useUpdateTask(teamId: string, boardId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      await api.updateTask(teamId, boardId, taskId, updates);
      return { taskId, updates };
    },
    onMutate: async ({ taskId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: boardQueryKeys.tasks(teamId, boardId) });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(boardQueryKeys.tasks(teamId, boardId));
      
      // Optimistically update task
      queryClient.setQueryData<Task[]>(
        boardQueryKeys.tasks(teamId, boardId),
        (old) => old?.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        ) || []
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Revert to previous state on error
      if (context?.previousTasks) {
        queryClient.setQueryData(boardQueryKeys.tasks(teamId, boardId), context.previousTasks);
      }
      toast.error(err instanceof APIError ? err.message : "Failed to update task");
    },
  });
}

export function useDeleteTask(teamId: string, boardId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.deleteTask(teamId, boardId, taskId);
      return taskId;
    },
    onMutate: async (taskId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: boardQueryKeys.tasks(teamId, boardId) });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(boardQueryKeys.tasks(teamId, boardId));
      
      // Optimistically remove task
      queryClient.setQueryData<Task[]>(
        boardQueryKeys.tasks(teamId, boardId),
        (old) => old?.filter(task => task.id !== taskId) || []
      );
      
      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      // Revert to previous state on error
      if (context?.previousTasks) {
        queryClient.setQueryData(boardQueryKeys.tasks(teamId, boardId), context.previousTasks);
      }
      toast.error(err instanceof APIError ? err.message : "Failed to delete task");
    },
    onSuccess: (taskId) => {
      toast.success("Task deleted successfully");
    },
  });
}

export function useCreateList(teamId: string, boardId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (listData: { name: string }) => {
      const response = await api.createList(teamId, boardId, listData);
      return response;
    },
    onMutate: async (newList) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: boardQueryKeys.lists(teamId, boardId) });
      
      // Snapshot the previous value
      const previousLists = queryClient.getQueryData<List[]>(boardQueryKeys.lists(teamId, boardId));
      
      // Optimistically update to the new value
      const optimisticList: List = {
        id: `temp-${Date.now()}`,
        name: newList.name,
        position: previousLists?.length || 0,
        _count: { tasks: 0 },
      };
      
      queryClient.setQueryData<List[]>(
        boardQueryKeys.lists(teamId, boardId),
        (old) => [...(old || []), optimisticList]
      );
      
      return { previousLists, optimisticList };
    },
    onError: (err, newList, context) => {
      // Revert to previous state on error
      if (context?.previousLists) {
        queryClient.setQueryData(boardQueryKeys.lists(teamId, boardId), context.previousLists);
      }
      toast.error(err instanceof APIError ? err.message : "Failed to create list");
    },
    onSuccess: (data, variables, context) => {
      // Refresh lists data to get the real list
      queryClient.invalidateQueries({ queryKey: boardQueryKeys.lists(teamId, boardId) });
      toast.success("List created successfully");
    },
  });
}

export function useDeleteList(teamId: string, boardId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (listId: string) => {
      await api.deleteList(teamId, boardId, listId);
      return listId;
    },
    onMutate: async (listId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: boardQueryKeys.lists(teamId, boardId) });
      
      // Snapshot the previous value
      const previousLists = queryClient.getQueryData<List[]>(boardQueryKeys.lists(teamId, boardId));
      
      // Optimistically remove list
      queryClient.setQueryData<List[]>(
        boardQueryKeys.lists(teamId, boardId),
        (old) => old?.filter(list => list.id !== listId) || []
      );
      
      return { previousLists };
    },
    onError: (err, listId, context) => {
      // Revert to previous state on error
      if (context?.previousLists) {
        queryClient.setQueryData(boardQueryKeys.lists(teamId, boardId), context.previousLists);
      }
      toast.error(err instanceof APIError ? err.message : "Failed to delete list");
    },
    onSuccess: (listId) => {
      toast.success("List deleted successfully");
    },
  });
}
