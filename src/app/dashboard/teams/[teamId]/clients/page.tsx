"use client";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/components/auth/session-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Users, Building, Mail, Phone, Calendar, FolderOpen, Plus, Edit, Trash2 } from "lucide-react";
import { ClientForm } from "@/components/clients/ClientForm";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  projects: Array<{
    id: string;
    name: string;
    status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    boards: Array<{
      id: string;
      name: string;
      type: 'KANBAN' | 'SCRUM';
      _count: {
        tasks: number;
      };
    }>;
  }>;
}

interface Board {
  id: string;
  name: string;
  type: 'KANBAN' | 'SCRUM';
  _count: {
    tasks: number;
  };
}

const projectStatusColors = {
  PLANNING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function TeamClientsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { session, loading: sessionLoading } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchClients();
      fetchBoards();
    }
  }, [teamId, sessionLoading, session]);

  async function fetchClients() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No session found');
        return;
      }

      const response = await fetch(`/api/teams/${teamId}/clients`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBoards() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/teams/${teamId}/boards`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  }

  function handleOpen(editClient?: Client) {
    setEditing(editClient || null);
    setOpen(true);
  }

  function handleFormSuccess() {
    setOpen(false);
    setEditing(null);
    fetchClients();
    toast.success(editing ? 'Client updated successfully' : 'Client created successfully');
  }

  function handleFormCancel() {
    setOpen(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No session found');
        return;
      }

      await fetch(`/api/teams/${teamId}/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  }

  async function createProjectWithBoard(clientId: string, boardId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No session found');
        return;
      }

      const board = boards.find(b => b.id === boardId);
      if (!board) return;

      await fetch(`/api/teams/${teamId}/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: `Project for ${clients.find(c => c.id === clientId)?.name}`,
          clientId,
          boardId
        })
      });
      fetchClients();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Clients</h2>
          <p className="text-muted-foreground">Manage clients and their project boards</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => handleOpen()} className="gap-2">
              <Users className="h-4 w-4" />
              Add Client
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {editing ? "Edit Client" : "Add Client"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ClientForm
                client={editing ? {
                  id: editing.id,
                  name: editing.name,
                  email: editing.email,
                  phone: editing.phone || undefined,
                  company: editing.company || undefined,
                  address: editing.address || undefined,
                  notes: editing.notes || undefined,
                  projects: editing.projects
                } : undefined}
                teamId={teamId}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first client to the team.
            </p>
            <Button onClick={() => handleOpen()} variant="outline">
              Add Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <Card key={client.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {client.company && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building className="h-3 w-3" />
                        {client.company}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleOpen(client)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(client.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Projects and Boards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Projects & Boards</h4>
                    {boards.length > 0 && (
                      <Select onValueChange={(boardId) => createProjectWithBoard(client.id, boardId)}>
                        <SelectTrigger className="h-8 w-8 p-0">
                          <SelectValue>
                            <Plus className="h-4 w-4" />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {boards.map(board => (
                            <SelectItem key={board.id} value={board.id}>
                              {board.name} ({board.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  {client.projects.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-2 border border-dashed rounded">
                      No projects assigned
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {client.projects.map(project => (
                        <div key={project.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{project.name}</span>
                            <Badge className={cn("text-xs", projectStatusColors[project.status])}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {project.boards.length > 0 && (
                            <div className="grid grid-cols-1 gap-1">
                              {project.boards.map(board => (
                                <div key={board.id} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                                  <div className="flex items-center gap-1">
                                    <FolderOpen className="h-3 w-3" />
                                    <span className="truncate">{board.name}</span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {board._count.tasks} tasks
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
