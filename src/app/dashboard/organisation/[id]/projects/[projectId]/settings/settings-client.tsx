"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/components/auth/session-context";
import { getSessionToken } from "@/lib/supabase/client-session";
import { toast } from "sonner";
import { format } from "date-fns";
import { getCurrencySymbol, CURRENCY_SYMBOLS } from "@/lib/utils";
import {
  Settings,
  FolderKanban,
  DollarSign,
  Users2,
  AlertTriangle,
  Trash2,
  Save,
  Loader2,
  Calendar,
  Target,
  LayoutGrid,
  CheckCircle2,
  FileText,
  Receipt,
  ArrowLeft,
  RefreshCw,
  Shield,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// Project Status options
const PROJECT_STATUSES = [
  { value: "PLANNING", label: "Planning", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "ON_HOLD", label: "On Hold", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { value: "COMPLETED", label: "Completed", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budget: number | null;
  currency: string;
  goal: number | null;
  completedTasks: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  teamId: string;
  organisationId: string | null;
  clientId: string | null;
  team?: {
    id: string;
    name: string;
    _count?: {
      members: number;
    };
  };
  organisation?: {
    id: string;
    name: string;
    ownerId: string;
  };
  _count?: {
    boards: number;
    invoices: number;
    proposals: number;
    issues: number;
    estimations: number;
  };
}

interface TeamMember {
  id: string;
  role: string;
  user: {
    id: string;
    displayName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface ProjectSettingsClientProps {
  orgId: string;
  projectId: string;
}

export function ProjectSettingsClient({ orgId, projectId }: ProjectSettingsClientProps) {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    budget: "",
    currency: "INR",
    goal: "",
    startDate: "",
    endDate: "",
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Fetch project data
  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getSessionToken();
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`/api/organisations/${orgId}/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Project not found");
          router.push(`/dashboard/organisation/${orgId}`);
          return;
        }
        throw new Error("Failed to fetch project");
      }

      const data = await response.json();
      setProject(data);
      
      // Populate form
      setFormData({
        name: data.name || "",
        description: data.description || "",
        status: data.status || "PLANNING",
        budget: data.budget?.toString() || "",
        currency: data.currency || "INR",
        goal: data.goal?.toString() || "",
        startDate: data.startDate ? format(new Date(data.startDate), "yyyy-MM-dd") : "",
        endDate: data.endDate ? format(new Date(data.endDate), "yyyy-MM-dd") : "",
      });

      // Fetch team members
      if (data.teamId) {
        fetchTeamMembers(data.teamId);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project settings");
    } finally {
      setLoading(false);
    }
  }, [orgId, projectId, router]);

  // Fetch team members
  const fetchTeamMembers = async (teamId: string) => {
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`/api/teams/${teamId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchProject();
    }
  }, [sessionLoading, session, fetchProject]);

  // Handle form changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save project settings
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setSaving(true);
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`/api/organisations/${orgId}/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          currency: formData.currency,
          goal: formData.goal ? parseInt(formData.goal) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      toast.success("Project settings saved successfully");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project settings");
    } finally {
      setSaving(false);
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    const expectedConfirmation = `delete ${project?.name}`;
    
    if (deleteConfirmation.toLowerCase() !== expectedConfirmation.toLowerCase()) {
      toast.error(`Please type "delete ${project?.name}" to confirm`);
      return;
    }

    try {
      setDeleting(true);
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`/api/organisations/${orgId}/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }

      toast.success("Project deleted successfully");
      router.push(`/dashboard/organisation/${orgId}`);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Check if current user is owner
  const isOwner = project?.organisation?.ownerId === session?.user?.id;
  const isTeamOwner = teamMembers.some(
    (m) => m.user.id === session?.user?.id && m.role === "owner"
  );
  const canDelete = isOwner || isTeamOwner;

  // Loading state
  if (loading || sessionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-12 bg-muted rounded animate-pulse" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Project not found</h3>
        <p className="text-muted-foreground mb-4">
          The project you're looking for doesn't exist or you don't have access.
        </p>
        <Link href={`/dashboard/organisation/${orgId}`}>
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organisation
          </Button>
        </Link>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(formData.currency);
  const progressPercent = project.goal && project.goal > 0
    ? Math.round(((project.completedTasks || 0) / project.goal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
            <Settings className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Settings</h1>
            <p className="text-muted-foreground">
              Manage settings for <span className="font-medium text-foreground">{project.name}</span>
            </p>
          </div>
        </div>
        <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="general" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Budget & Goals</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users2 className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 text-destructive data-[state=active]:text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Danger Zone</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          {/* Project Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Project Information
              </CardTitle>
              <CardDescription>
                Basic details about your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter project name"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your project..."
                  rows={4}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    min={formData.startDate || undefined}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          {/* Project Stats */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Project Statistics
              </CardTitle>
              <CardDescription>
                Overview of project activity and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <LayoutGrid className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">{project._count?.boards || 0}</p>
                  <p className="text-xs text-muted-foreground">Boards</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Receipt className="h-6 w-6 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{project._count?.invoices || 0}</p>
                  <p className="text-xs text-muted-foreground">Invoices</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <FileText className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">{project._count?.proposals || 0}</p>
                  <p className="text-xs text-muted-foreground">Proposals</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <AlertCircle className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                  <p className="text-2xl font-bold">{project._count?.issues || 0}</p>
                  <p className="text-xs text-muted-foreground">Issues</p>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Project ID</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{project.id}</code>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Team</span>
                  <span className="font-medium">{project.team?.name || "—"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(project.createdAt), "PPP")}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(project.updatedAt), "PPP")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget & Goals */}
        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Settings
              </CardTitle>
              <CardDescription>
                Configure project budget and financial settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currency & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                        <SelectItem key={code} value={code}>
                          {code} ({symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {currencySymbol}
                    </span>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => handleChange("budget", e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              {/* Current Budget Display */}
              {project.budget && project.budget > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Current Budget</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {currencySymbol}{project.budget.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Goals
              </CardTitle>
              <CardDescription>
                Set task goals and track progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Goal */}
              <div className="space-y-2">
                <Label htmlFor="goal">Task Goal</Label>
                <Input
                  id="goal"
                  type="number"
                  min="0"
                  value={formData.goal}
                  onChange={(e) => handleChange("goal", e.target.value)}
                  placeholder="Number of tasks to complete"
                />
                <p className="text-xs text-muted-foreground">
                  Set a target number of tasks to complete for this project
                </p>
              </div>

              {/* Progress */}
              {project.goal && project.goal > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {project.completedTasks || 0} / {project.goal} tasks ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Budget & Goals
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Team members who have access to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No team members found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user.avatarUrl || undefined} />
                          <AvatarFallback>
                            {(member.user.displayName || member.user.email)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user.displayName || member.user.email.split("@")[0]}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant={member.role === "owner" ? "default" : "secondary"}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/teams`}>
                <Button variant="outline">
                  <Users2 className="h-4 w-4 mr-2" />
                  Manage Team
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Access Control Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Access Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Organisation Owner</p>
                    <p className="text-muted-foreground">
                      Has full access to all projects and can delete them
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Team Owner</p>
                    <p className="text-muted-foreground">
                      Can manage project settings and team members
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Team Member</p>
                    <p className="text-muted-foreground">
                      Can view and work on project tasks
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Archive Project */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Archive Project</h4>
                  <p className="text-sm text-muted-foreground">
                    Mark this project as archived. It will be hidden from the main view.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleChange("status", "CANCELLED");
                    handleSave();
                  }}
                  disabled={formData.status === "CANCELLED"}
                >
                  {formData.status === "CANCELLED" ? "Archived" : "Archive"}
                </Button>
              </div>

              <Separator />

              {/* Delete Project */}
              <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                <div>
                  <h4 className="font-medium text-destructive">Delete Project</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this project and all its data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={!canDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </Button>
              </div>

              {!canDelete && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Only organisation owners or team owners can delete projects.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal - Supabase Style */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription className="pt-2">
              This action cannot be undone. This will permanently delete the project{" "}
              <span className="font-semibold text-foreground">{project.name}</span> and all
              associated data including:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>All boards and tasks</li>
              <li>All invoices and proposals</li>
              <li>All issues and estimations</li>
              <li>All project history and activity</li>
            </ul>

            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <Label htmlFor="deleteConfirmation" className="text-sm font-medium">
                To confirm, type{" "}
                <code className="px-1.5 py-0.5 bg-muted rounded text-destructive font-mono text-xs">
                  delete {project.name}
                </code>
              </Label>
              <Input
                id="deleteConfirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={`delete ${project.name}`}
                className="mt-2"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={
                deleting ||
                deleteConfirmation.toLowerCase() !== `delete ${project.name}`.toLowerCase()
              }
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
