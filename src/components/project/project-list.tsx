"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectModal } from "./project-modal";
import { FolderKanban, Plus, Loader2, Calendar, CheckCircle2, DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { getSessionToken } from '@/lib/supabase/client-session';
import { getCurrencySymbol } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  goal?: number;
  completedTasks?: number;
  createdAt: string;
  budget?: number;
  currency?: string;
}

interface ProjectListProps {
  organisationId: string;
}

export function ProjectList({ organisationId }: ProjectListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [canCreateMore, setCanCreateMore] = useState(true);
  const [limits, setLimits] = useState({ current: 0, limit: 0 });

  const fetchProjects = async () => {
    console.log('[ProjectList] ========== FETCH START ==========');
    console.log('[ProjectList] Organisation ID:', organisationId);

    try {
      setLoading(true);

      // Get session token for authorization
      console.log('[ProjectList] Getting session token...');
      const token = await getSessionToken();

      console.log('[ProjectList] Token check:', {
        hasToken: !!token,
        tokenLength: token?.length
      });

      if (!token) {
        console.log('[ProjectList] ❌ No session token, redirecting to login...');
        router.push('/auth/login');
        return;
      }

      console.log('[ProjectList] Fetching projects from API...');
      const response = await fetch(`/api/organisations/${organisationId}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[ProjectList] Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[ProjectList] ❌ API Error:', error);

        if (response.status === 401) {
          console.log('[ProjectList] 401 Unauthorized - redirecting to login');
          router.push('/auth/login');
          return;
        }

        throw new Error(error.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      console.log('[ProjectList] ✅ Fetched projects:', {
        count: data.projects?.length || 0
      });

      setProjects(data.projects || []);
      setCanCreateMore(data.meta?.canCreateMore ?? true);
      setLimits({
        current: data.meta?.currentCount ?? 0,
        limit: data.meta?.limit ?? 0
      });

      console.log('[ProjectList] ========== FETCH COMPLETE ==========');
    } catch (error) {
      console.error('[ProjectList] ❌ Error fetching projects:', error);
      console.log('[ProjectList] ========== FETCH FAILED ==========');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [organisationId]);

  const handleCreateClick = () => {
    if (!canCreateMore) {
      alert(`This organisation has reached the maximum number of projects (${limits.limit}).`);
      return;
    }
    setShowModal(true);
  };

  const handleSuccess = () => {
    fetchProjects();
  };

  const handleProjectClick = (project: Project) => {
    router.push(`/dashboard/organisation/${organisationId}/projects/${project.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ON_HOLD':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgress = (project: Project) => {
    if (!project.goal || project.goal === 0) return 0;
    return Math.round(((project.completedTasks || 0) / project.goal) * 100);
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const progress = getProgress(project);
    const [budget, setBudget] = useState(project.budget || 0);
    const [showSlider, setShowSlider] = useState(false);
    const currencySymbol = getCurrencySymbol(project.currency || 'INR');

    const handleBudgetChange = async (value: number[]) => {
      const newBudget = value[0];
      setBudget(newBudget);

      try {
        const token = await getSessionToken();
        if (!token) return;

        const response = await fetch(`/api/organisations/${organisationId}/projects/${project.id}`, {
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
        // Optional: Show success toast only on final commit or debounce
      } catch (error) {
        console.error('Error updating budget:', error);
        toast.error('Failed to update budget');
      }
    };

    return (
      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-indigo-200"
        onClick={() => handleProjectClick(project)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                {project.description && (
                  <CardDescription className="mt-1 line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Progress Bar */}
            {project.goal && project.goal > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{project.completedTasks || 0} / {project.goal} tasks completed</span>
                </div>
              </div>
            )}

            {/* Budget Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>Budget</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {currencySymbol}{budget.toLocaleString()}
                </span>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                {!showSlider ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => setShowSlider(true)}
                  >
                    Change Budget
                  </Button>
                ) : (
                  <div className="px-1 py-2">
                    <Slider
                      defaultValue={[budget]}
                      max={1000000} // This should ideally be dynamic or higher
                      step={100}
                      onValueCommit={(value) => {
                        handleBudgetChange(value);
                        // Keep slider open or close it? User request implies "shows the budget slider", 
                        // maybe it stays open or toggles. Let's keep it open for adjustment.
                      }}
                      className="py-2"
                    />
                    <div className="flex justify-end mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-5 px-2 text-gray-500"
                        onClick={() => setShowSlider(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {project.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-center gap-1">
                    <span>→</span>
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(project.endDate), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectClick(project);
                }}
              >
                Open Project →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = () => (
    <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
      <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Projects Yet
      </h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        Create your first project to start organizing your work and team.
      </p>
      <Button onClick={handleCreateClick}>
        <Plus className="w-4 h-4 mr-2" />
        Create Project
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {projects.length > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              {!canCreateMore && (
                <span className="text-amber-600 ml-2">
                  (Limit: {limits.current}/{limits.limit})
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleCreateClick} disabled={!canCreateMore}>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        organisationId={organisationId}
      />
    </div>
  );
}
