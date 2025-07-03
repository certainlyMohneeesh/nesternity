"use client";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useSession } from "@/components/auth/session-context";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Calendar, 
  Users, 
  MoreVertical, 
  Archive, 
  FolderOpen, 
  AlertCircle,
  Kanban,
  Target,
  CheckSquare
} from "lucide-react";

interface Board {
  id: string;
  name: string;
  description?: string;
  type: 'KANBAN' | 'SCRUM';
  createdAt: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    client?: {
      id: string;
      name: string;
      company?: string;
    };
  };
  _count: {
    tasks: number;
    issues: number;
  };
  lists: Array<{
    id: string;
    name: string;
    _count: {
      tasks: number;
    };
  }>;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  client?: {
    id: string;
    name: string;
    company?: string;
  };
}

const projectStatusColors = {
  PLANNING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function BoardsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { session, loading: sessionLoading } = useSession();
  const [boards, setBoards] = useState<Board[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("boards");
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [boardType, setBoardType] = useState("KANBAN");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchBoards();
      fetchProjects();
    }
  }, [sessionLoading, session, teamId]);

  async function fetchBoards() {
    try {
      setLoading(true);
      setError(null);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/teams/${teamId}/boards`, {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
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

  async function fetchProjects() {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}/projects`, {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!boardName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/teams/${teamId}/boards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: boardName.trim(),
          description: boardDescription.trim() || null,
          type: boardType,
          projectId: selectedProject || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setBoards(prev => [data.board, ...prev]);
        setBoardName("");
        setBoardDescription("");
        setSelectedProject("");
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

  async function linkBoardToProject(boardId: string, projectId: string) {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}/boards/${boardId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId })
      });

      if (response.ok) {
        fetchBoards();
      }
    } catch (error) {
      console.error('Error linking board to project:', error);
    }
  }

  const boardsByProject = boards.reduce((acc, board) => {
    const key = board.project?.id || 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(board);
    return acc;
  }, {} as Record<string, Board[]>);

  const unassignedBoards = boardsByProject.unassigned || [];
  const projectBoards = Object.entries(boardsByProject).filter(([key]) => key !== 'unassigned');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Boards</h2>
          <p className="text-muted-foreground">Organize your team's work with project boards</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Board
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Kanban className="h-5 w-5" />
                Create a New Board
              </SheetTitle>
            </SheetHeader>
            <form onSubmit={handleCreateBoard} className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="boardName">Board Name *</Label>
                <Input 
                  id="boardName"
                  value={boardName} 
                  onChange={e => setBoardName(e.target.value)} 
                  placeholder="Enter board name"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="boardDescription">Description</Label>
                <Textarea
                  id="boardDescription"
                  value={boardDescription} 
                  onChange={e => setBoardDescription(e.target.value)} 
                  placeholder="Add a description for your board..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="boardType">Board Type</Label>
                  <Select value={boardType} onValueChange={setBoardType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KANBAN">
                        <div className="flex items-center gap-2">
                          <Kanban className="h-4 w-4" />
                          Kanban
                        </div>
                      </SelectItem>
                      <SelectItem value="SCRUM" disabled>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span className="text-muted-foreground">Scrum</span>
                          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Link to Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No project</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-3 w-3" />
                            <span>{project.name}</span>
                            {project.client && (
                              <span className="text-xs text-muted-foreground">
                                ({project.client.name})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Board"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="boards" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            All Boards ({boards.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            By Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="boards" className="space-y-4">
          {error && !open && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : boards.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 space-y-4">
                <Kanban className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-medium text-lg mb-2">No boards yet</h3>
                  <p className="text-muted-foreground">Create your first board to start organizing your team's work.</p>
                </div>
                <Button onClick={() => setOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Board
                </Button>
              </div>
            ) : (
              boards.map(board => (
                <BoardCard 
                  key={board.id} 
                  board={board} 
                  teamId={teamId}
                  projects={projects}
                  onLinkProject={linkBoardToProject}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {/* Unassigned Boards */}
          {unassignedBoards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Unassigned Boards</h3>
                <Badge variant="outline">{unassignedBoards.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {unassignedBoards.map(board => (
                  <BoardCard 
                    key={board.id} 
                    board={board} 
                    teamId={teamId}
                    projects={projects}
                    onLinkProject={linkBoardToProject}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Project-based Boards */}
          {projectBoards.map(([projectId, boards]) => {
            const project = projects.find(p => p.id === projectId);
            if (!project) return null;

            return (
              <div key={projectId} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5" />
                    <div>
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      {project.client && (
                        <p className="text-sm text-muted-foreground">
                          Client: {project.client.name}
                          {project.client.company && ` (${project.client.company})`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${projectStatusColors[project.status]}`}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{boards.length} board{boards.length !== 1 ? 's' : ''}</Badge>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 ml-8">
                  {boards.map(board => (
                    <BoardCard 
                      key={board.id} 
                      board={board} 
                      teamId={teamId}
                      projects={projects}
                      onLinkProject={linkBoardToProject}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {projectBoards.length === 0 && unassignedBoards.length === 0 && !loading && (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No project boards</h3>
              <p className="text-muted-foreground">Create boards and link them to projects to organize your work.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BoardCard({ 
  board, 
  teamId, 
  projects, 
  onLinkProject 
}: { 
  board: Board; 
  teamId: string; 
  projects: Project[];
  onLinkProject: (boardId: string, projectId: string) => void;
}) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg leading-tight">{board.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {board.type === 'KANBAN' ? (
                  <div className="flex items-center gap-1">
                    <Kanban className="h-3 w-3" />
                    Kanban
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Scrum
                  </div>
                )}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <CheckSquare className="h-3 w-3 mr-1" />
                {board._count.tasks} tasks
              </Badge>
              {board._count.issues > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {board._count.issues} issues
                </Badge>
              )}
            </div>
            
            {board.project && (
              <div className="flex items-center gap-2 mt-2">
                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{board.project.name}</span>
                <Badge className={`text-xs ${projectStatusColors[board.project.status]}`}>
                  {board.project.status.replace('_', ' ')}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {board.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {board.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Project Link Section */}
        {!board.project && projects.length > 0 && (
          <div className="border-t pt-3">
            <Label className="text-xs font-medium text-muted-foreground">Link to Project</Label>
            <Select onValueChange={(projectId) => onLinkProject(board.id, projectId)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id} className="text-xs">
                    {project.name}
                    {project.client && ` (${project.client.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            Created {new Date(board.createdAt).toLocaleDateString()}
          </div>
          <Button asChild size="sm">
            <Link href={`/dashboard/teams/${teamId}/boards/${board.id}`}>
              Open Board
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
