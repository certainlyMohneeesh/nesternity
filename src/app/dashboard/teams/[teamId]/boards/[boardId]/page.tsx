"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
  assignee: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
}

export default function BoardViewPage({ params }: { params: { teamId: string; boardId: string } }) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", column_id: "" });

  useEffect(() => {
    fetchBoardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.boardId]);

  async function fetchBoardData() {
    setLoading(true);
    const { data: columnsData } = await supabase
      .from("board_columns")
      .select("*")
      .eq("board_id", params.boardId)
      .order("position");
    setColumns(columnsData || []);
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .eq("board_id", params.boardId);
    setTasks(tasksData || []);
    setLoading(false);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title || !newTask.column_id) return;
    await supabase.from("tasks").insert([
      { ...newTask, board_id: params.boardId },
    ]);
    setOpen(false);
    setNewTask({ title: "", description: "", column_id: "" });
    fetchBoardData();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Board</h2>
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
                    <Button type="submit" className="w-full">Add</Button>
                  </form>
                </SheetContent>
              </Sheet>
              <div className="flex flex-col gap-2">
                {tasks.filter(t => t.column_id === col.id).map(task => (
                  <Card key={task.id} className="p-4">
                    <div className="font-bold">{task.title}</div>
                    <div className="text-xs text-muted-foreground mb-1">{task.status || ""}</div>
                    <div className="text-sm">{task.description}</div>
                  </Card>
                ))}
              </div>
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
    </div>
  );
}
