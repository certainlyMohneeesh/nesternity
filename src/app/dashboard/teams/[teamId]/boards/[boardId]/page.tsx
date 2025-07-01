"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useSession } from "@/components/auth/session-context";
import { api, APIError } from "@/lib/api-client";
import { toast } from "sonner";

interface List {
  id: string;
  name: string;
  position: number;
  color?: string;
  _count: {
    tasks: number;
  };
}

// AddColumnForm component definition
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

export default function BoardViewPage({ params }: { params: { teamId: string; boardId: string } }) {
  const { session } = useSession();
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

  useEffect(() => {
    fetchBoardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.boardId]);

  async function fetchBoardData() {
    setLoading(true);
    try {
      // Fetch lists and tasks in parallel
      const [listsResponse, tasksResponse] = await Promise.all([
        api.getLists(params.teamId, params.boardId),
        api.getTasks(params.teamId, params.boardId)
      ]);
      
      setLists(listsResponse.lists || []);
      setTasks(tasksResponse.tasks || []);
      
      // Fetch team members for task assignment
      const teamResponse = await api.getTeam(params.teamId);
      const members = teamResponse.team.members || [];
      setTeamMembers(members);
      
    } catch (error) {
      console.error("Error fetching board data:", error);
      toast.error(error instanceof APIError ? error.message : "Failed to load board data");
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
      
      await api.createTask(params.teamId, params.boardId, taskData);
      
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

  async function handleDragEnd(result: any) {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update task position and list
    const newListId = destination.droppableId;
    const newPosition = destination.index;
    const oldList = lists.find(l => l.id === source.droppableId);
    const newList = lists.find(l => l.id === newListId);

    try {
      // Update in database
      await api.updateTask(params.teamId, params.boardId, draggableId, {
        listId: newListId,
        position: newPosition
      });

      // Refresh data
      fetchBoardData();
      
      if (oldList && newList && oldList.id !== newList.id) {
        toast.success(`Task moved from "${oldList.name}" to "${newList.name}"`);
      }
    } catch (error) {
      console.error("Error moving task:", error);
      toast.error(error instanceof APIError ? error.message : "Failed to move task");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Board</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          {loading ? (
            <div className="text-muted-foreground">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="text-muted-foreground">No lists yet.</div>
          ) : (
            lists.map(list => (
              <div key={list.id} className="min-w-[300px] w-80 bg-muted/30 rounded-lg p-4 flex flex-col gap-4">
                <div className="font-bold mb-2">{list.name}</div>
                <Sheet open={open && newTask.listId === list.id} onOpenChange={v => setOpen(v)}>
                  <SheetTrigger asChild>
                    <Button size="sm" onClick={() => setNewTask(t => ({ ...t, listId: list.id }))}>Add Task</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Add Task</SheetTitle>
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
                <Droppable droppableId={list.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex flex-col gap-2 min-h-[200px] p-2 rounded",
                        snapshot.isDraggingOver && "bg-muted/50"
                      )}
                    >
                      {tasks
                        .filter(t => t.listId === list.id)
                        .sort((a, b) => a.position - b.position)
                        .map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "p-4 cursor-grab active:cursor-grabbing",
                                  snapshot.isDragging && "shadow-lg rotate-3"
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
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))
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
              </SheetHeader>
              <AddColumnForm teamId={params.teamId} boardId={params.boardId} onColumnAdded={fetchBoardData} />
            </SheetContent>
          </Sheet>
        </div>
      </DragDropContext>
    </div>
  );
}
