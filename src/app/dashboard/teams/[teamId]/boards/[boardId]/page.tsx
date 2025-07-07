"use client";
import { useEffect, useState, use, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/session-context";
import { api, APIError } from "@/lib/api-client";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

interface List {
  id: string;
  name: string;
  position: number;
  color?: string;
  _count: {
    tasks: number;
  };
}

// AddColumnForm component with optimistic updates
function AddColumnForm({ 
  teamId, 
  boardId, 
  onColumnAdded, 
  onOptimisticAdd 
}: { 
  teamId: string; 
  boardId: string; 
  onColumnAdded: () => void;
  onOptimisticAdd: (list: List) => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    
    // Create optimistic list
    const optimisticList: List = {
      id: `temp-${Date.now()}`,
      name,
      position: 999, // Will be adjusted by server
      _count: { tasks: 0 }
    };

    // Add optimistically to UI
    onOptimisticAdd(optimisticList);
    setName("");
    onColumnAdded(); // Close the sheet
    
    try {
      const response = await api.createList(teamId, boardId, { name });
      // The parent component should replace the optimistic list with the real one
      toast.success("List created successfully");
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error(error instanceof APIError ? error.message : "Failed to create list");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <Label>List Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding..." : "Add List"}
      </Button>
    </form>
  );
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

// dnd-kit SortableTask component
function SortableTask({ 
  task, 
  index, 
  onDelete, 
  onComplete 
}: { 
  task: Task; 
  index: number;
  onDelete: (taskId: string, taskTitle: string) => void;
  onComplete: (taskId: string, taskTitle: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 group border-l-4 bg-card border-border",
        task.priority === "HIGH" && "border-l-red-500",
        task.priority === "MEDIUM" && "border-l-yellow-500", 
        task.priority === "LOW" && "border-l-green-500",
        !task.priority && "border-l-gray-300",
        isDragging && "opacity-50 shadow-2xl rotate-2 scale-105"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold text-sm text-foreground leading-tight flex-1">
          {task.title}
        </div>
        <div className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4m-4 0l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>
      {task.description && (
        <div className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">{task.description}</div>
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {task.priority && (
            <div className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full text-center min-w-[50px] border",
              task.priority === "HIGH" && "border-red-200 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-200 dark:bg-red-900/60",
              task.priority === "MEDIUM" && "border-yellow-200 text-yellow-700 bg-yellow-50 dark:border-yellow-700 dark:text-yellow-200 dark:bg-yellow-900/60",
              task.priority === "LOW" && "border-green-200 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-200 dark:bg-green-900/60"
            )}>
              {task.priority}
            </div>
          )}
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      {task.assignee?.displayName && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium shadow-sm">
            {task.assignee.displayName.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-xs text-muted-foreground font-medium">{task.assignee.displayName}</span>
        </div>
      )}
      {/* Action buttons - only visible on hover */}
      <div className="flex items-center justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/40"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this task as completed? This will remove it from the board.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onComplete(task.id, task.title)}
                className="bg-green-600 hover:bg-green-700"
              >
                Complete Task
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/40"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this task? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(task.id, task.title)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Task
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

// DroppableList wraps each list as a droppable area for tasks
function DroppableList({ list, children }: { list: List; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: list.id });
  return (
    <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[200px] p-2 rounded bg-white">
      {children}
    </div>
  );
}

export default function BoardViewPage({ params }: { params: Promise<{ teamId: string; boardId: string }> }) {
  const { session, loading: sessionLoading } = useSession();
  const resolvedParams = use(params);
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: "", 
    description: "", 
    listId: "", 
    assignedTo: "", 
    priority: "MEDIUM",
    dueDate: ""
  });

  // dnd-kit state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Optimized: fetch lists and tasks in parallel, render UI as soon as they're ready, fetch team members in background
  useEffect(() => {
    let ignore = false;
    async function fetchListsAndTasks() {
      setLoading(true);
      try {
        // Remove any artificial delay
        const [listsResponse, tasksResponse] = await Promise.all([
          api.getLists(resolvedParams.teamId, resolvedParams.boardId),
          api.getTasks(resolvedParams.teamId, resolvedParams.boardId)
        ]);
        if (!ignore) {
          setLists(listsResponse.lists || []);
          setTasks(tasksResponse.tasks || []);
          setLoading(false);
        }
        // Fetch team members in background, do not block UI
        api.getTeam(resolvedParams.teamId)
          .then(teamResponse => {
            if (!ignore) {
              setTeamMembers(teamResponse.team.members || []);
            }
          })
          .catch(teamError => {
            if (!ignore) {
              setTeamMembers([]);
              toast.error("Could not load team members for task assignment");
            }
          });
      } catch (error) {
        if (!ignore) {
          setLoading(false);
          console.error("Error fetching board data:", error);
          if (error instanceof APIError) {
            if (error.status === 401) {
              toast.error("Please log in again");
            } else if (error.status === 403) {
              toast.error("You don't have access to this board");
            } else {
              toast.error(error.message);
            }
          } else {
            toast.error("Failed to load board data");
          }
        }
      }
    }
    if (!sessionLoading && session) {
      fetchListsAndTasks();
    } else if (!sessionLoading && !session) {
      setLoading(false);
      toast.error("Please log in to view board data");
    }
    return () => { ignore = true; };
  }, [resolvedParams.boardId, session, sessionLoading]);

  // Memoize sorted tasks per list
  const sortedTasksByList = useMemo(() => {
    const map: Record<string, Task[]> = {};
    lists.forEach(list => {
      map[list.id] = tasks.filter(t => t.listId === list.id).sort((a, b) => a.position - b.position);
    });
    return map;
  }, [lists, tasks]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Please log in to view this board</div>
      </div>
    );
  }

  async function fetchBoardData() {
    if (!session) {
      toast.error("Please log in to view board data");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const [listsResponse, tasksResponse] = await Promise.all([
        api.getLists(resolvedParams.teamId, resolvedParams.boardId),
        api.getTasks(resolvedParams.teamId, resolvedParams.boardId)
      ]);
      setLists(listsResponse.lists || []);
      setTasks(tasksResponse.tasks || []);
      
      // Fetch team members separately to avoid blocking the main board data
      try {
        console.log('🔄 Fetching team members for team:', resolvedParams.teamId);
        const teamResponse = await api.getTeam(resolvedParams.teamId);
        console.log('✅ Team response:', teamResponse);
        
        const members = teamResponse.team.members || [];
        console.log('👥 Team members found:', members.length, members);
        setTeamMembers(members);
      } catch (teamError) {
        console.error('❌ Error fetching team members:', teamError);
        // Don't block the board loading if team fetch fails
        setTeamMembers([]);
        toast.error("Could not load team members for task assignment");
      }
    } catch (error) {
      console.error("Error fetching board data:", error);
      if (error instanceof APIError) {
        if (error.status === 401) {
          toast.error("Please log in again");
        } else if (error.status === 403) {
          toast.error("You don't have access to this board");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to load board data");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title || !newTask.listId) return;
    
    // Create optimistic task
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`, // Temporary ID
      title: newTask.title,
      description: newTask.description,
      listId: newTask.listId,
      assignedTo: newTask.assignedTo || null,
      status: "TODO",
      priority: newTask.priority,
      dueDate: newTask.dueDate || null,
      position: tasks.filter(t => t.listId === newTask.listId).length,
      assignee: newTask.assignedTo ? teamMembers.find(m => m.userId === newTask.assignedTo)?.user : undefined,
      list: lists.find(l => l.id === newTask.listId)!
    };

    // Optimistically add to UI
    setTasks(prev => [...prev, optimisticTask]);
    setOpen(false);
    
    // Clear form
    const taskData = {
      title: newTask.title,
      description: newTask.description,
      listId: newTask.listId,
      assignedTo: newTask.assignedTo || null,
      priority: newTask.priority,
      dueDate: newTask.dueDate || null
    };
    
    setNewTask({ 
      title: "", 
      description: "", 
      listId: "", 
      assignedTo: "", 
      priority: "MEDIUM", 
      dueDate: "" 
    });

    try {
      const response = await api.createTask(resolvedParams.teamId, resolvedParams.boardId, taskData);
      
      // Replace optimistic task with real task
      setTasks(prev => prev.map(t => 
        t.id === optimisticTask.id ? response.task : t
      ));
      

    } catch (error) {
      console.error("Error creating task:", error);
      // Remove optimistic task on error
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
      toast.error(error instanceof APIError ? error.message : "Failed to create task");
    }
  }

  // dnd-kit drag end handler with optimistic updates
  async function handleDragEnd(event: any) {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || active.id === over.id) return;

    // Prevent API calls for optimistic (temp) tasks
    if (String(active.id).startsWith('temp-')) {
      // Only update UI state, skip server sync
      const draggedTask = tasks.find(t => t.id === active.id);
      if (!draggedTask) return;
      let targetListId: string;
      let targetPosition: number;
      const overList = lists.find(l => l.id === over.id);
      if (overList) {
        targetListId = overList.id;
        const listTasks = tasks.filter(t => t.listId === overList.id && t.id !== active.id);
        targetPosition = listTasks.length;
      } else {
        const overTask = tasks.find(t => t.id === over.id);
        if (!overTask) return;
        targetListId = overTask.listId;
        const listTasks = tasks.filter(t => t.listId === targetListId && t.id !== active.id);
        const overIndex = listTasks.findIndex(t => t.id === over.id);
        targetPosition = overIndex >= 0 ? overIndex : listTasks.length;
      }
      const updatedTasks = tasks.map(task => {
        if (task.id === active.id) {
          return { ...task, listId: targetListId, position: targetPosition };
        }
        if (task.listId === targetListId && task.id !== active.id) {
          if (task.position >= targetPosition) {
            return { ...task, position: task.position + 1 };
          }
        }
        if (task.listId === draggedTask.listId && targetListId !== draggedTask.listId) {
          if (task.position > draggedTask.position) {
            return { ...task, position: task.position - 1 };
          }
        }
        return task;
      });
      setTasks(updatedTasks);
      return;
    }

    // Find the task being dragged
    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    // Determine the destination list and position
    let targetListId: string;
    let targetPosition: number;

    // If dropped over a list (column), move to end of that list
    const overList = lists.find(l => l.id === over.id);
    if (overList) {
      targetListId = overList.id;
      const listTasks = tasks.filter(t => t.listId === overList.id && t.id !== active.id);
      targetPosition = listTasks.length;
    } else {
      // If dropped over another task, find which list and position
      const overTask = tasks.find(t => t.id === over.id);
      if (!overTask) return;
      
      targetListId = overTask.listId;
      const listTasks = tasks.filter(t => t.listId === targetListId && t.id !== active.id);
      const overIndex = listTasks.findIndex(t => t.id === over.id);
      targetPosition = overIndex >= 0 ? overIndex : listTasks.length;
    }

    // Optimistically update the UI immediately
    const updatedTasks = tasks.map(task => {
      if (task.id === active.id) {
        return { ...task, listId: targetListId, position: targetPosition };
      }
      // Adjust positions of other tasks in the target list
      if (task.listId === targetListId && task.id !== active.id) {
        if (task.position >= targetPosition) {
          return { ...task, position: task.position + 1 };
        }
      }
      // Adjust positions of tasks in the source list (if different from target)
      if (task.listId === draggedTask.listId && targetListId !== draggedTask.listId) {
        if (task.position > draggedTask.position) {
          return { ...task, position: task.position - 1 };
        }
      }
      return task;
    });

    // Update the UI state immediately
    setTasks(updatedTasks);

    // Sync with server in the background
    try {
      await api.updateTask(resolvedParams.teamId, resolvedParams.boardId, active.id, {
        listId: targetListId,
        position: targetPosition
      });
      // Optionally show a subtle success indicator
      // toast.success("Task moved", { duration: 1000 });
    } catch (error) {
      console.error("Error moving task:", error);
      // Revert the optimistic update on error
      setTasks(tasks);
      toast.error(error instanceof APIError ? error.message : "Failed to move task");
    }
  }

  // Handle optimistic list addition
  function handleOptimisticListAdd(optimisticList: List) {
    setLists(prev => [...prev, optimisticList]);
  }

  // Handle list creation completion (replace optimistic with real)
  async function handleListAdded() {
    try {
      // Fetch only the lists to replace optimistic ones with real data
      const listsResponse = await api.getLists(resolvedParams.teamId, resolvedParams.boardId);
      setLists(listsResponse.lists || []);
    } catch (error) {
      console.error("Error refreshing lists:", error);
    }
  }

  // Delete a list with optimistic updates
  async function handleDeleteList(listId: string, listName: string) {
    // Check if list has tasks
    const listTasks = tasks.filter(t => t.listId === listId);
    if (listTasks.length > 0) {
      toast.error("Cannot delete list with tasks. Please move or delete all tasks first.");
      return;
    }

    // Optimistically remove from UI
    setLists(prev => prev.filter(l => l.id !== listId));

    try {
      await api.deleteList(resolvedParams.teamId, resolvedParams.boardId, listId);
      toast.success(`List "${listName}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting list:", error);
      // Revert optimistic update on error
      const listsResponse = await api.getLists(resolvedParams.teamId, resolvedParams.boardId);
      setLists(listsResponse.lists || []);
      toast.error(error instanceof APIError ? error.message : "Failed to delete list");
    }
  }

  // Delete a task with optimistic updates
  async function handleDeleteTask(taskId: string, taskTitle: string) {
    // Optimistically remove from UI
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await api.deleteTask(resolvedParams.teamId, resolvedParams.boardId, taskId);
      toast.success(`Task "${taskTitle}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting task:", error);
      // Revert optimistic update on error
      const tasksResponse = await api.getTasks(resolvedParams.teamId, resolvedParams.boardId);
      setTasks(tasksResponse.tasks || []);
      toast.error(error instanceof APIError ? error.message : "Failed to delete task");
    }
  }

  // Complete a task (move to completed status and remove from board)
  async function handleCompleteTask(taskId: string, taskTitle: string) {
    // Optimistically remove from UI
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await api.updateTask(resolvedParams.teamId, resolvedParams.boardId, taskId, {
        status: 'DONE',
        archived: true
      });
      toast.success(`Task "${taskTitle}" completed successfully! 🎉`);
    } catch (error) {
      console.error("Error completing task:", error);
      // Revert optimistic update on error
      const tasksResponse = await api.getTasks(resolvedParams.teamId, resolvedParams.boardId);
      setTasks(tasksResponse.tasks || []);
      toast.error(error instanceof APIError ? error.message : "Failed to complete task");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold">Board</h2>
        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
          💡 Drag and drop tasks across lists to manage them
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={e => setActiveTaskId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto">
          {loading ? (
            // Skeleton loader for lists and tasks
            [...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[300px] w-80 bg-muted/30 rounded-lg p-4 flex flex-col gap-4 animate-pulse">
                <div className="h-6 w-1/2 bg-muted rounded mb-2" />
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-16 bg-muted rounded mb-2" />
                ))}
              </div>
            ))
          ) : lists.length === 0 ? (
            <div className="text-muted-foreground">No lists yet.</div>
          ) : (
            lists.map(list => {
              const listTasks = sortedTasksByList[list.id] || [];
              return (
                <div key={list.id} className="min-w-[300px] w-80 bg-muted/30 rounded-lg p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold">{list.name}</div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-70 hover:opacity-100"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete List</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the list "{list.name}"? This action cannot be undone.
                            {listTasks.length > 0 && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                                ⚠️ This list contains {listTasks.length} task(s). Please move or delete all tasks first.
                              </div>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteList(list.id, list.name)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={listTasks.length > 0}
                          >
                            Delete List
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <Sheet open={open && newTask.listId === list.id} onOpenChange={v => setOpen(v)}>
                    <SheetTrigger asChild>
                      <Button size="sm" onClick={() => setNewTask(t => ({ ...t, listId: list.id }))}>Add Task</Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Add Task</SheetTitle>
                        <SheetDescription>
                          Create a new task for this list
                        </SheetDescription>
                      </SheetHeader>
                      <form onSubmit={handleAddTask} className="space-y-4 mt-4">
                        <div>
                          <Label>Title</Label>
                          <Input value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} required />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input value={newTask.description} onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Assignee</Label>
                          <select 
                            value={newTask.assignedTo} 
                            onChange={e => setNewTask(t => ({ ...t, assignedTo: e.target.value }))}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Unassigned</option>
                            {teamMembers.length === 0 ? (
                              <option value="" disabled>Loading team members...</option>
                            ) : (
                              teamMembers.map(member => {
                                console.log('👤 Rendering member:', member);
                                return (
                                  <option key={member.userId} value={member.userId}>
                                    {member.user?.displayName || member.user?.email || member.userId}
                                  </option>
                                );
                              })
                            )}
                          </select>
                          {/* Debug info */}
                          <div className="text-xs text-gray-500 mt-1">
                            Team members loaded: {teamMembers.length}
                          </div>
                        </div>
                        <div>
                          <Label>Priority</Label>
                          <Select value={newTask.priority} onValueChange={value => setNewTask(t => ({ ...t, priority: value }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Calendar
                            selected={newTask.dueDate ? new Date(newTask.dueDate) : undefined}
                            onSelect={date => setNewTask(t => ({
                              ...t,
                              dueDate: date
                                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                                : ""
                            }))}
                            mode="single"
                            className="w-full border rounded-md p-2"
                          />
                        </div>
                        <Button type="submit" className="w-full">Add</Button>
                      </form>
                    </SheetContent>
                  </Sheet>
                  <SortableContext
                    items={listTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableList list={list}>
                      {listTasks.map((task, index) => (
                        <SortableTask 
                          key={task.id} 
                          task={task} 
                          index={index} 
                          onDelete={handleDeleteTask}
                          onComplete={handleCompleteTask}
                        />
                      ))}
                    </DroppableList>
                  </SortableContext>
                </div>
              );
            })
          )}
          {/* Add new list UI */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="min-w-[300px] w-80 h-[56px] flex items-center justify-center">
                + Add List
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add New List</SheetTitle>
                <SheetDescription>
                  Create a new list to organize your tasks
                </SheetDescription>
              </SheetHeader>
              <AddColumnForm 
                teamId={resolvedParams.teamId} 
                boardId={resolvedParams.boardId} 
                onColumnAdded={handleListAdded}
                onOptimisticAdd={handleOptimisticListAdd}
              />
            </SheetContent>
          </Sheet>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTaskId ? (
            <div className="rotate-3 scale-105">
              <SortableTask
                task={tasks.find(t => t.id === activeTaskId)!}
                index={0}
                onDelete={handleDeleteTask}
                onComplete={handleCompleteTask}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}