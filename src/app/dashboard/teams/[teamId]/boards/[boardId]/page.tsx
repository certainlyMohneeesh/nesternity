"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useSession } from "@/components/auth/session-context";
import { createActivity, ACTIVITY_TYPES } from "@/lib/notifications";

interface Column {
  id: string;
  name: string;
  position: number;
}

// AddColumnForm component definition
function AddColumnForm({ boardId, onColumnAdded }: { boardId: string; onColumnAdded: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    await supabase.from("board_columns").insert([
      { name, board_id: boardId }
    ]);
    setName("");
    setLoading(false);
    onColumnAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <Label>Column Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding..." : "Add Column"}
      </Button>
    </form>
  );
}
interface Task {
  id: string;
  title: string;
  description: string;
  column_id: string;
  assignee_id: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  position: number;
  assignee?: { name: string; id: string };
}

interface TeamMember {
  id: string;
  user_id: string;
  users: { name: string; id: string };
}

export default function BoardViewPage({ params }: { params: { teamId: string; boardId: string } }) {
  const { session } = useSession();
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: "", 
    description: "", 
    column_id: "", 
    assignee_id: "", 
    priority: "medium",
    due_date: ""
  });

  useEffect(() => {
    fetchBoardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.boardId]);

  async function fetchBoardData() {
    setLoading(true);
    // Fetch columns
    const { data: columnsData } = await supabase
      .from("board_columns")
      .select("*")
      .eq("board_id", params.boardId)
      .order("position");
    setColumns(columnsData || []);
    
    // Fetch tasks with assignee info
    const { data: tasksData } = await supabase
      .from("tasks")
      .select(`
        *,
        assignee:users(name, id)
      `)
      .eq("board_id", params.boardId)
      .order("position");
    setTasks(tasksData || []);
    
    // Fetch team members
    const { data: membersData } = await supabase
      .from("team_users")
      .select("id, user_id, users(name, id)")
      .eq("team_id", params.teamId);
    setTeamMembers((membersData || []).map((member: any) => ({
      ...member,
      users: Array.isArray(member.users) ? member.users[0] : member.users
    })));
    
    setLoading(false);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title || !newTask.column_id) return;
    
    // Get the position for the new task (last in column)
    const tasksInColumn = tasks.filter(t => t.column_id === newTask.column_id);
    const position = tasksInColumn.length;
    
    const { data: insertedTask, error } = await supabase.from("tasks").insert([
      { 
        ...newTask, 
        board_id: params.boardId,
        position,
        assignee_id: newTask.assignee_id || null,
        due_date: newTask.due_date || null
      },
    ]).select().single();
    
    if (!error && insertedTask) {
      // Create activity for task creation
      const assignedMember = teamMembers.find(m => m.user_id === newTask.assignee_id);
      let description = `Task "${newTask.title}" was created`;
      if (assignedMember) {
        description += ` and assigned to ${assignedMember.users.name}`;
      }
      
      await createActivity(
        params.teamId,
        ACTIVITY_TYPES.TASK_CREATED,
        `New task: ${newTask.title}`,
        description,
        params.boardId,
        insertedTask.id
      );
    }
    
    setOpen(false);
    setNewTask({ title: "", description: "", column_id: "", assignee_id: "", priority: "medium", due_date: "" });
    fetchBoardData();
  }

  async function handleDragEnd(result: any) {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update task position and column
    const newColumnId = destination.droppableId;
    const newPosition = destination.index;
    const oldColumn = columns.find(c => c.id === source.droppableId);
    const newColumn = columns.find(c => c.id === newColumnId);

    // Update in database
    const { error } = await supabase
      .from("tasks")
      .update({ 
        column_id: newColumnId,
        position: newPosition
      })
      .eq("id", draggableId);

    if (!error && oldColumn && newColumn && oldColumn.id !== newColumn.id) {
      // Create activity for task movement
      await createActivity(
        params.teamId,
        ACTIVITY_TYPES.TASK_MOVED,
        `Task moved: ${task.title}`,
        `Task "${task.title}" was moved from "${oldColumn.name}" to "${newColumn.name}"`,
        params.boardId,
        task.id
      );
    }

    // Refresh data
    fetchBoardData();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Board</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          {loading ? (
            <div className="text-muted-foreground">Loading columns...</div>
          ) : columns.length === 0 ? (
            <div className="text-muted-foreground">No columns yet.</div>
          ) : (
            columns.map(col => (
              <div key={col.id} className="min-w-[300px] w-80 bg-muted/30 rounded-lg p-4 flex flex-col gap-4">
                <div className="font-bold mb-2">{col.name}</div>
                <Sheet open={open && newTask.column_id === col.id} onOpenChange={v => setOpen(v)}>
                  <SheetTrigger asChild>
                    <Button size="sm" onClick={() => setNewTask(t => ({ ...t, column_id: col.id }))}>Add Task</Button>
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
                          value={newTask.assignee_id} 
                          onChange={e => setNewTask(t => ({ ...t, assignee_id: e.target.value }))}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map(member => (
                            <option key={member.user_id} value={member.user_id}>
                              {member.users?.name || member.user_id}
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
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <Label>Due Date</Label>
                        <Input 
                          type="date" 
                          value={newTask.due_date} 
                          onChange={e => setNewTask(t => ({ ...t, due_date: e.target.value }))} 
                        />
                      </div>
                      <Button type="submit" className="w-full">Add</Button>
                    </form>
                  </SheetContent>
                </Sheet>
                <Droppable droppableId={col.id}>
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
                        .filter(t => t.column_id === col.id)
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
                                {task.assignee?.name && (
                                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                                    {task.assignee.name}
                                  </div>
                                )}
                                {task.priority && (
                                  <div className={cn(
                                    "text-xs px-2 py-1 rounded mt-1 inline-block ml-1",
                                    task.priority === "high" && "bg-red-100 text-red-800",
                                    task.priority === "medium" && "bg-yellow-100 text-yellow-800",
                                    task.priority === "low" && "bg-green-100 text-green-800"
                                  )}>
                                    {task.priority}
                                  </div>
                                )}
                                {task.due_date && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Due: {new Date(task.due_date).toLocaleDateString()}
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
          {/* Add new column UI */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="min-w-[300px] w-80 h-[56px] flex items-center justify-center">
                + Add Column
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add New Column</SheetTitle>
              </SheetHeader>
              <AddColumnForm boardId={params.boardId} onColumnAdded={fetchBoardData} />
            </SheetContent>
          </Sheet>
        </div>
      </DragDropContext>
    </div>
  );
}
