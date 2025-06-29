"use client";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useSession } from "@/components/auth/session-context";

interface Board {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export default function BoardsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { session } = useSession();
  const userId = session?.user.id;
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardType, setBoardType] = useState("kanban");

  useEffect(() => {
    if (userId) fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, teamId]);

  async function fetchBoards() {
    setLoading(true);
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });
    if (!error && data) setBoards(data);
    setLoading(false);
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!boardName) return;
    await supabase.from("boards").insert([
      { name: boardName, type: boardType, team_id: teamId },
    ]);
    setOpen(false);
    setBoardName("");
    setBoardType("kanban");
    fetchBoards();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Boards</h2>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>Create Board</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create a New Board</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleCreateBoard} className="space-y-4 mt-4">
              <div>
                <Label>Board Name</Label>
                <Input value={boardName} onChange={e => setBoardName(e.target.value)} required />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="input w-full"
                  value={boardType}
                  onChange={e => setBoardType(e.target.value)}
                >
                  <option value="kanban">Kanban</option>
                  <option value="scrum">Scrum</option>
                </select>
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="text-muted-foreground">Loading boards...</div>
        ) : boards.length === 0 ? (
          <div className="text-muted-foreground">No boards for this team yet.</div>
        ) : (
          boards.map(board => (
            <Card key={board.id} className="p-6 flex flex-col gap-2">
              <div className="font-bold text-lg">{board.name}</div>
              <div className="text-xs text-muted-foreground mb-2">{board.type.charAt(0).toUpperCase() + board.type.slice(1)} board</div>
              <Button asChild variant="outline">
                <Link href={`/dashboard/teams/${teamId}/boards/${board.id}`}>Open Board</Link>
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
