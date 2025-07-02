"use client";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSession } from "@/components/auth/session-context";
import { Plus, Calendar, Users, MoreVertical, Archive } from "lucide-react";

interface Board {
  id: string;
  name: string;
  description?: string;
  type: 'KANBAN' | 'SCRUM';
  createdAt: string;
  _count: {
    tasks: number;
  };
  lists: Array<{
    id: string;
    name: string;
    _count: {
      tasks: number;
    };
  }>;
}

export default function BoardsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { session, loading: sessionLoading } = useSession();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [boardType, setBoardType] = useState("KANBAN");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchBoards();
    }
  }, [sessionLoading, session, teamId]);

  async function fetchBoards() {
    try {
      setLoading(true);
      setError(null);

      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/teams/${teamId}/boards`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setBoards(data.boards || []);
      } else {
        setError(data.error || 'Failed to fetch boards');
      }
    } catch (error) {
      console.error('Fetch boards error:', error);
      setError('Failed to fetch boards');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!boardName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/teams/${teamId}/boards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: boardName.trim(),
          description: boardDescription.trim() || null,
          type: boardType
        })
      });

      const data = await response.json();

      if (response.ok) {
        setBoards(prev => [data.board, ...prev]);
        setBoardName("");
        setBoardDescription("");
        setOpen(false);
      } else {
        setError(data.error || 'Failed to create board');
      }
    } catch (error) {
      console.error('Create board error:', error);
      setError('Failed to create board');
    } finally {
      setCreating(false);
    }
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
                    <option value="scrum" disabled>Scrum <Badge variant="secondary" className="ml-2">Coming Soon</Badge></option>
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
