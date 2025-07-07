'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  ExternalLink,
  Plus,
  Building2
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate: string;
  endDate: string;
  clientName: string;
  clientCompany: string;
  teamMembers: number;
  totalTasks: number;
  completedTasks: number;
  budget?: number;
  spent?: number;
  progress: number;
}

interface DemoProjectCardProps {
  project: Project;
  onView?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onAddTask?: (project: Project) => void;
}

export function DemoProjectCard({ project, onView, onEdit, onAddTask }: DemoProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
      case 'PLANNING': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'COMPLETED': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(project.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isOverdue = daysRemaining < 0;
  const isDueSoon = daysRemaining <= 7 && daysRemaining >= 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
              <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{project.clientCompany}</span>
            </div>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{project.completedTasks} of {project.totalTasks} tasks</span>
            <span>{project.totalTasks - project.completedTasks} remaining</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Start Date</div>
              <div>{new Date(project.startDate).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">End Date</div>
              <div className={isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-yellow-600 font-medium' : ''}>
                {new Date(project.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Due Status */}
        {(isOverdue || isDueSoon) && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            isOverdue 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {isOverdue ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span>
              {isOverdue 
                ? `Overdue by ${Math.abs(daysRemaining)} days`
                : `Due in ${daysRemaining} days`
              }
            </span>
          </div>
        )}

        {/* Team and Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{project.teamMembers} members</span>
          </div>
          {project.budget && (
            <div className="text-sm">
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="font-medium">
                {formatCurrency(project.spent || 0)} / {formatCurrency(project.budget)}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(project)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Project
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onAddTask?.(project)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProjectListProps {
  projects: Project[];
  onAddProject?: () => void;
  onViewProject?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onAddTask?: (project: Project) => void;
}

export function ProjectList({ 
  projects, 
  onAddProject, 
  onViewProject, 
  onEditProject, 
  onAddTask 
}: ProjectListProps) {
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const totalTasks = projects.reduce((sum, p) => sum + p.totalTasks, 0);
  const completedTasks = projects.reduce((sum, p) => sum + p.completedTasks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Project Portfolio</h3>
          <p className="text-sm text-muted-foreground">
            Manage your projects from planning to completion
          </p>
        </div>
        <Button onClick={onAddProject} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{activeProjects}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{completedProjects}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Task Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <DemoProjectCard
            key={project.id}
            project={project}
            onView={onViewProject}
            onEdit={onEditProject}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first project to start organizing your work
          </p>
          <Button onClick={onAddProject} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Project
          </Button>
        </div>
      )}
    </div>
  );
}
