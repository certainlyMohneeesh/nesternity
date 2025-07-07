'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  clientId?: string;
  teamId: string;
  client?: {
    id: string;
    name: string;
    company?: string;
  };
  team: {
    id: string;
    name: string;
  };
  boards: {
    id: string;
    name: string;
  }[];
  _count: {
    boards: number;
    issues: number;
  };
  createdAt: string;
}

export default function ProjectsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [optimisticProjects, setOptimisticProjects] = useState<Project[]>([]);

  const handleCreate = () => {
    setEditingProject(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowEditDialog(true);
  };

  const handleDelete = (project: Project) => {
    // Delete is handled in ProjectList component
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSubmit = async (projectData: {
    name: string;
    description?: string;
    clientId?: string;
    teamId: string;
    startDate?: string;
    endDate?: string;
    status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    goal?: number;
  }) => {
    let tempId: string | null = null;
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('You must be logged in');
      }
      // Optimistic UI: add temp project
      if (!editingProject) {
        tempId = `temp-${Date.now()}`;
        const tempProject: Project = {
          id: tempId,
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          startDate: projectData.startDate,
          endDate: projectData.endDate,
          clientId: projectData.clientId,
          teamId: projectData.teamId,
          client: undefined,
          team: { id: projectData.teamId, name: '...' },
          boards: [],
          _count: { boards: 0, issues: 0 },
          createdAt: new Date().toISOString(),
        };
        setOptimisticProjects(prev => [tempProject, ...prev]);
      }
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(projectData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save project');
      }
      // On success, remove temp and trigger refresh
      setShowCreateDialog(false);
      setShowEditDialog(false);
      setEditingProject(null);
      setRefreshTrigger(prev => prev + 1);
      if (tempId) setOptimisticProjects(prev => prev.filter(p => p.id !== tempId));
    } catch (error) {
      if (tempId) setOptimisticProjects(prev => prev.filter(p => p.id !== tempId));
      console.error('Error saving project:', error);
      alert(error instanceof Error ? error.message : 'Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setEditingProject(null);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Projects</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage all your projects across teams
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Project List */}
      <ProjectList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        refreshTrigger={refreshTrigger}
        optimisticProjects={optimisticProjects}
      />

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <ProjectForm
              project={{
                name: editingProject.name,
                description: editingProject.description || '',
                clientId: editingProject.clientId || '',
                teamId: editingProject.teamId,
                startDate: editingProject.startDate ? editingProject.startDate.split('T')[0] : '',
                endDate: editingProject.endDate ? editingProject.endDate.split('T')[0] : '',
                status: editingProject.status,
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
