'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from './ProjectCard';

import { Trash2, Edit, Plus, Users, Calendar, Building2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BoardWithTasks {
  id: string;
  name: string;
  tasks: { id: string; title: string; status: string }[];
}

interface ProjectWithTasks extends Project {
  boards: BoardWithTasks[];
}

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

interface ProjectListProps {
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onCreate: () => void;
  refreshTrigger?: number;
}

const statusColors = {
  PLANNING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function ProjectList({ onEdit, onDelete, onCreate, refreshTrigger }: ProjectListProps) {
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);

  const fetchBoardsWithTasks = async (projectId: string, token: string) => {
    const boardsRes = await fetch(`/api/projects/${projectId}/boards`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!boardsRes.ok) return [];
    const boards = await boardsRes.json();
    const boardsWithTasks = await Promise.all(
      boards.map(async (board: any) => {
        const tasksRes = await fetch(`/api/boards/${board.id}/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        return { ...board, tasks };
      })
    );
    return boardsWithTasks;
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('You must be logged in to view projects');
        return;
      }
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projectsData = await response.json();
      // Fetch boards and tasks for each project
      const projectsWithTasks = await Promise.all(
        projectsData.map(async (project: Project) => {
          const boards = await fetchBoardsWithTasks(project.id, session.access_token);
          return { ...project, boards };
        })
      );
      setProjects(projectsWithTasks);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(projects.filter(p => p.id !== project.id));
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchProjects} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-600 mb-4">Get started by creating your first project</p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Projects ({projects.length})</h2>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            issuesCount={project._count.issues}
            onEdit={() => onEdit(project)}
            onDelete={() => handleDelete(project)}
          />
        ))}
      </div>
    </div>
  );
}
