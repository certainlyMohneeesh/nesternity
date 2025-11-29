import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Users, Calendar, Building2, ListChecks, AlertTriangle, Edit, Trash2, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSessionToken } from '@/lib/supabase/client-session';
import { toast } from 'sonner';

interface Board {
  id: string;
  name: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: string;
}

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    startDate?: string;
    endDate?: string;
    client?: { name: string; company?: string };
    team: { name: string };
    boards: Board[];
    _count: { boards: number; issues: number };
    createdAt: string;
    goal?: number;
    budget?: number;
  };
  issuesCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

const statusColors = {
  PLANNING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function ProjectCard({ project, issuesCount, onEdit, onDelete }: ProjectCardProps) {
  // Aggregate all tasks from all boards
  const allTasks = project.boards.flatMap(board => board.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(task => task.status === 'DONE').length;
  // Use project.goal if present, otherwise fallback to totalTasks
  const goal = project.goal ?? totalTasks;
  const progress = goal > 0 ? Math.round((completedTasks / goal) * 100) : 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const [budget, setBudget] = useState(project.budget || 0);

  const handleBudgetChange = async (value: number[]) => {
    const newBudget = value[0];
    setBudget(newBudget);

    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ budget: newBudget }),
      });

      if (!response.ok) {
        throw new Error('Failed to update budget');
      }
      toast.success('Budget updated');
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
            <CardDescription className="mt-1">
              {project.description || 'No description'}
            </CardDescription>
          </div>
          <Badge className={statusColors[project.status]}>{project.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {project.client && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{project.client.name}</span>
            {project.client.company && (
              <span className="text-gray-400">({project.client.company})</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{project.team.name}</span>
        </div>
        {(project.startDate || project.endDate) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(project.startDate)} - {formatDate(project.endDate) || 'Ongoing'}
            </span>
          </div>
        )}
        {/* Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Goal: {goal} tasks</span>
            <span className="text-xs text-muted-foreground">{completedTasks}/{goal} done</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        {/* Budget Slider */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>Budget</span>
            </div>
            <span className="text-xs font-medium">${budget.toLocaleString()}</span>
          </div>
          <Slider
            defaultValue={[budget]}
            max={100000}
            step={100}
            onValueCommit={handleBudgetChange}
            className="py-2"
          />
        </div>
        {/* Issues Count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span>{issuesCount} issues</span>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
