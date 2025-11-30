"use client";
import { useState, use, useMemo } from "react";
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

// React Query hooks
import {
  useBoardDetails,
  useBoardLists,
  useBoardTasks,
  useTeamMembers,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCreateList,
  useDeleteList,
} from "@/hooks/use-board-data";

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

// AddColumnForm component
function AddColumnForm({
  teamId,
  boardId,
  onColumnAdded
}: {
  teamId: string;
  boardId: string;
  onColumnAdded: () => void;
}) {
  const [name, setName] = useState("");
  const createListMutation = useCreateList(teamId, boardId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    createListMutation.mutate({ name }, {
      onSuccess: () => {
        setName("");
        onColumnAdded();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <Label>List Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={createListMutation.isPending}>
        {createListMutation.isPending ? "Adding..." : "Add List"}
      </Button>
    </form>
  );
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    LOW: "border-l-4 border-l-green-500 dark:border-l-green-400",
    MEDIUM: "border-l-4 border-l-yellow-500 dark:border-l-yellow-400",
    HIGH: "border-l-4 border-l-red-500 dark:border-l-red-400"
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-3 bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700 rounded-lg cursor-move",
        "hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200",
        priorityColors[task.priority as keyof typeof priorityColors]
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/40"
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task.id, task.title);
              }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
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
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium capitalize">{task.priority.toLowerCase()}</span>
          {task.assignee && (
            <span className="bg-muted dark:bg-gray-700 px-2 py-1 rounded text-xs">
              {task.assignee.displayName || task.assignee.email}
            </span>
          )}
        </div>

        {task.dueDate && (
          <div className="text-xs text-muted-foreground">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </Card>
  );
}

// DroppableList wraps each list as a droppable area for tasks
function DroppableList({ list, children }: { list: List; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: list.id });
  return (
    <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[200px] p-2 rounded bg-white dark:bg-gray-900">
      {children}
    </div>
  );
}

export default function BoardViewPage({ params }: { params: Promise<{ teamId: string; boardId: string }> }) {
  const { session, loading: sessionLoading } = useSession();
  const resolvedParams = use(params);

  // Memoize params to prevent unnecessary re-renders
  const stableParams = useMemo(() => resolvedParams, [resolvedParams.teamId, resolvedParams.boardId]);

  // React Query hooks for data fetching with intelligent caching
  const {
    data: board,
    isLoading: boardLoading,
    error: boardError
  } = useBoardDetails(stableParams.teamId, stableParams.boardId, !!session && !sessionLoading);

  const {
    data: lists = [],
    isLoading: listsLoading,
    error: listsError
  } = useBoardLists(stableParams.teamId, stableParams.boardId, !!session && !sessionLoading);

  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError
  } = useBoardTasks(stableParams.teamId, stableParams.boardId, !!session && !sessionLoading);

  const {
    data: teamMembers = [],
    isLoading: teamMembersLoading
  } = useTeamMembers(stableParams.teamId, !!session && !sessionLoading);

  // Mutations
  const createTaskMutation = useCreateTask(stableParams.teamId, stableParams.boardId);
  const updateTaskMutation = useUpdateTask(stableParams.teamId, stableParams.boardId);
  const deleteTaskMutation = useDeleteTask(stableParams.teamId, stableParams.boardId);
  const createListMutation = useCreateList(stableParams.teamId, stableParams.boardId);
  const deleteListMutation = useDeleteList(stableParams.teamId, stableParams.boardId);

  // Local UI state
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

  // Loading state
  const isLoading = sessionLoading || boardLoading || listsLoading || tasksLoading;

  // Memoize sorted tasks per list
  const sortedTasksByList = useMemo(() => {
    const map: Record<string, Task[]> = {};
    lists.forEach(list => {
      map[list.id] = tasks.filter(t => t.listId === list.id).sort((a, b) => a.position - b.position);
    });
    return map;
  }, [lists, tasks]);

  // Error handling
  if (boardError || listsError || tasksError) {
    const error = boardError || listsError || tasksError;
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load board data</div>
          <div className="text-sm text-muted-foreground">
            {error instanceof APIError ? error.message : "Something went wrong"}
          </div>
        </div>
      </div>
    );
  }

  if (sessionLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="flex gap-6 overflow-x-auto pb-6">
          {/* Skeleton loader for lists and tasks */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="min-w-[300px] w-80 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
              {/* List header skeleton */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-muted rounded w-20" />
                  <div className="h-5 w-6 bg-muted rounded-full" />
                </div>
                <div className="h-6 w-6 bg-muted rounded" />
              </div>

              {/* Add Task button skeleton */}
              <div className="h-8 bg-muted rounded mb-4 w-full" />

              {/* Task cards skeleton */}
              <div className="space-y-2">
                {[...Array([3, 2, 4][i] || 3)].map((_, j) => (
                  <div key={j} className="bg-white dark:bg-gray-900 shadow-sm border dark:border-gray-700 rounded-lg p-3 border-l-4 border-l-muted">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="flex gap-1">
                          <div className="h-4 w-4 bg-muted rounded" />
                          <div className="h-4 w-4 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-muted rounded w-12" />
                        <div className="h-4 bg-muted rounded w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add List skeleton */}
          <div className="min-w-[300px] w-80 h-[56px] bg-muted rounded animate-pulse flex items-center justify-center">
            <div className="h-4 bg-muted-foreground/20 rounded w-20" />
          </div>
        </div>
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

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title || !newTask.listId) return;

    const taskData = {
      title: newTask.title,
      description: newTask.description,
      listId: newTask.listId,
      assignedTo: newTask.assignedTo || null,
      priority: newTask.priority,
      dueDate: newTask.dueDate || null
    };

    createTaskMutation.mutate(taskData, {
      onSuccess: () => {
        setOpen(false);
        setNewTask({
          title: "",
          description: "",
          listId: "",
          assignedTo: "",
          priority: "MEDIUM",
          dueDate: ""
        });
      },
    });
  }

  // dnd-kit drag end handler with optimistic updates
  async function handleDragEnd(event: any) {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || active.id === over.id) return;

    // Prevent API calls for optimistic (temp) tasks
    if (String(active.id).startsWith('temp-')) {
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

    // Update task using mutation
    updateTaskMutation.mutate({
      taskId: active.id,
      updates: {
        listId: targetListId,
        position: targetPosition
      }
    });
  }

  // Delete a task
  function handleDeleteTask(taskId: string, taskTitle: string) {
    deleteTaskMutation.mutate(taskId);
  }

  // Complete a task (move to completed status and remove from board)
  function handleCompleteTask(taskId: string, taskTitle: string) {
    updateTaskMutation.mutate({
      taskId,
      updates: {
        status: 'DONE',
        archived: true
      }
    }, {
      onSuccess: () => {
        toast.success(`Task "${taskTitle}" completed successfully! 🎉`);
      }
    });
  }

  // Delete a list
  function handleDeleteList(listId: string, listName: string) {
    // Check if list has tasks
    const listTasks = tasks.filter(t => t.listId === listId);
    if (listTasks.length > 0) {
      toast.error("Cannot delete list with tasks. Please move or delete all tasks first.");
      return;
    }

    deleteListMutation.mutate(listId);
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold">{board?.name || 'Board'} Board</h2>
        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800">
          💡 Drag and drop tasks across lists to manage them
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveTaskId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6">
          {lists.map((list) => {
            const listTasks = sortedTasksByList[list.id] || [];

            return (
              <div key={list.id} className="min-w-[300px] w-80 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{list.name}</h3>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium">
                      {listTasks.length}
                    </span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete List</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{list.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteList(list.id, list.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete List
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mb-4 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                      size="sm"
                    >
                      + Add Task
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Add New Task</SheetTitle>
                      <SheetDescription>
                        Create a new task for this board
                      </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleAddTask} className="space-y-4 mt-4">
                      <div>
                        <Label>Task Title</Label>
                        <Input
                          value={newTask.title}
                          onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <textarea
                          value={newTask.description}
                          onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))}
                          className="w-full p-2 border rounded"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>List</Label>
                        <Select value={newTask.listId} onValueChange={value => setNewTask(t => ({ ...t, listId: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a list" />
                          </SelectTrigger>
                          <SelectContent>
                            {lists.map(list => (
                              <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Assign To</Label>
                        <Select
                          value={newTask.assignedTo || "unassigned"}
                          onValueChange={value => setNewTask(t => ({ ...t, assignedTo: value === "unassigned" ? "" : value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {teamMembers.length === 0 ? (
                              <SelectItem value="loading" disabled>Loading team members...</SelectItem>
                            ) : (
                              teamMembers.map((member: TeamMember) => (
                                <SelectItem key={member.userId} value={member.userId}>
                                  {member.user?.displayName || member.user?.email || member.userId}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground mt-1">
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
                      <Button type="submit" className="w-full" disabled={createTaskMutation.isPending}>
                        {createTaskMutation.isPending ? "Adding..." : "Add Task"}
                      </Button>
                    </form>
                  </SheetContent>
                </Sheet>

                <SortableContext
                  items={listTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableList list={list}>
                    {listTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm">No tasks yet</p>
                        <p className="text-xs mt-1">Add a task to get started</p>
                      </div>
                    ) : (
                      listTasks.map((task, index) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          index={index}
                          onDelete={handleDeleteTask}
                          onComplete={handleCompleteTask}
                        />
                      ))
                    )}
                  </DroppableList>
                </SortableContext>
              </div>
            );
          })}

          {/* Add new list UI */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[300px] w-80 h-[56px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
              >
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
                teamId={stableParams.teamId}
                boardId={stableParams.boardId}
                onColumnAdded={() => { }}
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
