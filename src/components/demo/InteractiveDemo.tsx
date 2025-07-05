'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle2, Users, ClipboardList, AlertTriangle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic imports to avoid SSR issues
import dynamic from 'next/dynamic';
import { DemoProjectList } from '@/components/ui/DemoProjectList';
import DemoTeamMembers from '@/components/ui/DemoTeamMembers';
import { IssueCard } from '@/components/issues/IssueCard';

const BoardComponent = dynamic(() => import('@/components/boards/BoardComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-muted/30 rounded-xl animate-pulse flex items-center justify-center">
      <div className="text-muted-foreground">Loading board...</div>
    </div>
  )
});

interface DemoStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  isCompleted?: boolean;
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: 'Create Project',
    subtitle: 'Start from your project dashboard',
    description: 'Begin by creating a new project. Define your goals, timeline, and scope to establish a solid foundation for your work.',
    icon: <Plus className="w-5 h-5" />,
    buttonText: 'Create Project'
  },
  {
    id: 2,
    title: 'Add Team Members',
    subtitle: 'Build your dream team',
    description: 'Invite team members with different roles and permissions. Collaborate effectively by bringing the right people together.',
    icon: <Users className="w-5 h-5" />,
    buttonText: 'Add Team Members'
  },
  {
    id: 3,
    title: 'Assign Tasks',
    subtitle: 'Organize work with boards',
    description: 'Use our interactive Kanban boards to create, assign, and track tasks. Drag and drop to update status and keep everyone aligned.',
    icon: <ClipboardList className="w-5 h-5" />,
    buttonText: 'Create Tasks'
  },
  {
    id: 4,
    title: 'Track Issues',
    subtitle: 'Identify and resolve problems',
    description: 'Log issues, assign priorities, and track resolution. Keep your project running smoothly with proactive issue management.',
    icon: <AlertTriangle className="w-5 h-5" />,
    buttonText: 'Report Issue'
  }
];

// Demo data
const demoProject = {
  id: "demo1",
  name: "Website Redesign",
  description: "A full redesign for Acme Corp's marketing site.",
  status: "ACTIVE",
  startDate: "2025-07-01",
  endDate: "2025-08-01",
  clientId: "client1",
  teamId: "team1",
  client: { id: "client1", name: "Acme Corp", company: "Acme" },
  team: { id: "team1", name: "Design Team" },
  boards: [],
  _count: { boards: 1, issues: 3 },
  createdAt: "2025-07-01"
};

const demoMembers = [
  {
    id: "1",
    user_id: "user1",
    role: "admin",
    accepted_at: new Date().toISOString(),
    users: { id: "user1", email: "jane@acme.com", display_name: "Jane Dev", avatar_url: "" }
  },
  {
    id: "2",
    user_id: "user2",
    role: "member",
    accepted_at: new Date().toISOString(),
    users: { id: "user2", email: "john@acme.com", display_name: "John PM", avatar_url: "" }
  },
  {
    id: "3",
    user_id: "user3",
    role: "member",
    accepted_at: new Date().toISOString(),
    users: { id: "user3", email: "sarah@acme.com", display_name: "Sarah Designer", avatar_url: "" }
  }
];

const demoIssue = {
  id: "issue1",
  title: "Mobile navigation not responsive",
  description: "The navigation menu breaks on mobile devices below 768px width. Users cannot access the main menu items.",
  status: "OPEN" as const,
  priority: "HIGH" as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  assignee: { id: "user1", email: "dev@acme.com", displayName: "Jane Dev", avatarUrl: "" },
  creator: { id: "user2", email: "pm@acme.com", displayName: "John PM" },
  project: { id: "demo1", name: "Website Redesign" },
  board: { id: "board1", name: "Sprint 1" },
  _count: { comments: 3 }
};

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    if (currentStep < demoSteps.length) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const handleStepAction = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    // Auto advance to next step after action
    setTimeout(() => {
      if (currentStep < demoSteps.length) {
        setCurrentStep(currentStep + 1);
      }
    }, 500);
  };

  const currentStepData = demoSteps.find(step => step.id === currentStep);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Your Project Dashboard</h3>
              <p className="text-muted-foreground">Start by creating a new project to organize your work</p>
            </div>
            <DemoProjectList projects={[demoProject]} />
            <div className="text-center">
              <Button onClick={handleStepAction} className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Project
              </Button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">Invite team members to collaborate on your project</p>
            </div>
            <DemoTeamMembers 
              members={demoMembers}
              teamCreatedBy="user1"
            />
            <div className="text-center">
              <Button onClick={handleStepAction} className="gap-2">
                <Users className="w-4 h-4" />
                Invite Team Members
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Task Management</h3>
              <p className="text-muted-foreground">Create and assign tasks using our interactive board</p>
            </div>
            <BoardComponent />
            <div className="text-center">
              <Button onClick={handleStepAction} className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Create Tasks
              </Button>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Issue Tracking</h3>
              <p className="text-muted-foreground">Track and resolve issues to keep your project on track</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <IssueCard 
                issue={demoIssue} 
                onStatusChange={() => {}} 
                onEdit={() => {}} 
                onDelete={() => {}} 
              />
            </div>
            <div className="text-center">
              <Button onClick={handleStepAction} className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Report Issue
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-background">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-muted-foreground mb-4">Experience the complete workflow from creation to deployment</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Step {currentStep}: {currentStepData?.title}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {currentStepData?.subtitle}
        </p>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center space-x-4 bg-muted/30 rounded-full p-2">
          {demoSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => handleStepClick(step.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : completedSteps.includes(step.id)
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {completedSteps.includes(step.id) ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  step.icon
                )}
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{step.id}</span>
              </button>
              {index < demoSteps.length - 1 && (
                <div className="w-8 h-px bg-border"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Card className="max-w-6xl mx-auto p-8 shadow-xl border-0 bg-background/80 backdrop-blur-sm">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              currentStep === 1 && "bg-blue-100 text-blue-600",
              currentStep === 2 && "bg-green-100 text-green-600", 
              currentStep === 3 && "bg-purple-100 text-purple-600",
              currentStep === 4 && "bg-orange-100 text-orange-600"
            )}>
              {currentStepData?.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{currentStepData?.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData?.description}</p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {renderStepContent()}
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{currentStep} / {demoSteps.length}</span>
            <div className="flex gap-1">
              {demoSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index + 1 === currentStep
                      ? "bg-primary"
                      : completedSteps.includes(index + 1)
                      ? "bg-green-500"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleNext}
            disabled={currentStep === demoSteps.length}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Completion Message */}
      {completedSteps.length === demoSteps.length && (
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Demo completed! Ready to start your project?
          </div>
        </div>
      )}
    </div>
  );
}
