"use client";
import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/session-context";
import { api, APIError } from "@/lib/api-client";
import { toast } from "sonner";

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

// AddColumnForm component definition (unchanged)
function AddColumnForm({ teamId, boardId, onColumnAdded }: { teamId: string; boardId: string; onColumnAdded: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    
    try {
      await api.createList(teamId, boardId, { name });
      setName("");
      onColumnAdded();
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
function SortableTask({ task, index }: { task: Task; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
      className={cn(
        "p-4 cursor-grab active:cursor-grabbing",
        isDragging && "shadow-lg rotate-3"
      )}
    >
      <div className="font-bold">{task.title}</div>
      {task.assignee?.displayName && (
        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
          {task.assignee.displayName}
        </div>
      )}
      {task.priority && (
        <div className={cn(
          "text-xs px-2 py-1 rounded mt-1 inline-block ml-1",
          task.priority === "HIGH" && "bg-red-100 text-red-800",
          task.priority === "MEDIUM" && "bg-yellow-100 text-yellow-800",
          task.priority === "LOW" && "bg-green-100 text-green-800"
        )}>
          {task.priority.toLowerCase()}
        </div>
      )}
      {task.dueDate && (
        <div className="text-xs text-gray-600 mt-1">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}
      <div className="text-sm mt-1">{task.description}</div>
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

  useEffect(() => {
    if (!sessionLoading && session) {
      fetchBoardData();
    } else if (!sessionLoading && !session) {
      setLoading(false);
      toast.error("Please log in to view board data");
    }
  }, [resolvedParams.boardId, session, sessionLoading]);

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
      const teamResponse = await api.getTeam(resolvedParams.teamId);
      const members = teamResponse.team.members || [];
      setTeamMembers(members);
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
    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        listId: newTask.listId,
        assignedTo: newTask.assignedTo || null,
        priority: newTask.priority,
        dueDate: newTask.dueDate || null
      };
      await api.createTask(resolvedParams.teamId, resolvedParams.boardId, taskData);
      setOpen(false);
      setNewTask({ 
        title: "", 
        description: "", 
        listId: "", 
        assignedTo: "", 
        priority: "MEDIUM", 
        dueDate: "" 
      });
      fetchBoardData();
      toast.success("Task created successfully");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error instanceof APIError ? error.message : "Failed to create task");
    }
  }

  // dnd-kit drag end handler (updated)
  async function handleDragEnd(event: any) {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || active.id === over.id) return;

    // Find the task being dragged
    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    // If dropped over a list (column), move to end of that list
    const overList = lists.find(l => l.id === over.id);
    if (overList) {
      const listTasks = tasks.filter(t => t.listId === overList.id).sort((a, b) => a.position - b.position);
      const newPosition = listTasks.length;
      try {
        await api.updateTask(resolvedParams.teamId, resolvedParams.boardId, active.id, {
          listId: overList.id,
          position: newPosition
        });
        fetchBoardData();
        toast.success("Task moved");
      } catch (error) {
        console.error("Error moving task:", error);
        toast.error(error instanceof APIError ? error.message : "Failed to move task");
      }
      return;
    }

    // If dropped over another task, move to that position in the same or another list
    for (const list of lists) {
      const listTasks = tasks.filter(t => t.listId === list.id).sort((a, b) => a.position - b.position);
      const overIndex = listTasks.findIndex(t => t.id === over.id);
      if (overIndex !== -1) {
        try {
          await api.updateTask(resolvedParams.teamId, resolvedParams.boardId, active.id, {
            listId: list.id,
            position: overIndex
          });
          fetchBoardData();
          toast.success("Task moved");
        } catch (error) {
          console.error("Error moving task:", error);
          toast.error(error instanceof APIError ? error.message : "Failed to move task");
        }
        return;
      }
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Board</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={e => setActiveTaskId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto">
          {loading ? (
            <div className="text-muted-foreground">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="text-muted-foreground">No lists yet.</div>
          ) : (
            lists.map(list => {
              // Get tasks for this list, sorted by position
              const listTasks = tasks.filter(t => t.listId === list.id).sort((a, b) => a.position - b.position);
              return (
                <div key={list.id} className="min-w-[300px] w-80 bg-muted/30 rounded-lg p-4 flex flex-col gap-4">
                  <div className="font-bold mb-2">{list.name}</div>
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
                            {teamMembers.map(member => (
                              <option key={member.userId} value={member.userId}>
                                {member.user?.displayName || member.user?.email || member.userId}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Priority</Label>
                          <select 
                            value={newTask.priority} 
                            onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))}
                            className="w-full p-2 border rounded"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Input 
                            type="date" 
                            value={newTask.dueDate} 
                            onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))} 
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
                        <SortableTask key={task.id} task={task} index={index} />
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
              <AddColumnForm teamId={resolvedParams.teamId} boardId={resolvedParams.boardId} onColumnAdded={fetchBoardData} />
            </SheetContent>
          </Sheet>
        </div>
        <DragOverlay>
          {activeTaskId ? (
            <SortableTask
              task={tasks.find(t => t.id === activeTaskId)!}
              index={0}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}