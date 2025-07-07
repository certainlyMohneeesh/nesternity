'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  Plus,
  Building2,
  FolderKanban,
  FileText,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic imports to avoid SSR issues
import dynamic from 'next/dynamic';
import { ClientList } from '@/components/demo/DemoClientCard';
import { ProjectList } from '@/components/demo/DemoProjectCard';
import { InvoiceList } from '@/components/demo/DemoInvoiceCard';
import DemoTeamMembers from '@/components/ui/DemoTeamMembers';
import { IssueCard } from '@/components/issues/IssueCard';

const BoardComponent = dynamic(() => import('@/components/boards/DemoBoardComponent'), {
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
    title: 'Create Clients',
    subtitle: 'Start by adding your clients',
    description: 'Build your client base by adding companies and contacts. This forms the foundation of your project management workflow.',
    icon: <Building2 className="w-5 h-5" />,
    buttonText: 'Add Client'
  },
  {
    id: 2,
    title: 'Setup Projects',
    subtitle: 'Organize work into projects',
    description: 'Create projects for your clients with clear timelines, budgets, and deliverables to keep everything organized.',
    icon: <FolderKanban className="w-5 h-5" />,
    buttonText: 'Create Project'
  },
  {
    id: 3,
    title: 'Add Team Members',
    subtitle: 'Build your dream team',
    description: 'Invite team members with different roles and permissions. Collaborate effectively by bringing the right people together.',
    icon: <Users className="w-5 h-5" />,
    buttonText: 'Add Team Members'
  },
  {
    id: 4,
    title: 'Create Boards',
    subtitle: 'Organize work with boards',
    description: 'Use our interactive Kanban boards to create, assign, and track tasks. Drag and drop to update status and keep everyone aligned.',
    icon: <ClipboardList className="w-5 h-5" />,
    buttonText: 'Create Board'
  },
  {
    id: 5,
    title: 'Track Issues',
    subtitle: 'Identify and resolve problems',
    description: 'Log issues, assign priorities, and track resolution. Keep your project running smoothly with proactive issue management.',
    icon: <AlertTriangle className="w-5 h-5" />,
    buttonText: 'Report Issue'
  },
  {
    id: 6,
    title: 'Generate Invoices',
    subtitle: 'Get paid for your work',
    description: 'Create professional invoices, track payments, and manage your revenue. Download PDFs and send them directly to clients.',
    icon: <Receipt className="w-5 h-5" />,
    buttonText: 'Create Invoice'
  }
];

// Demo data
const demoClients = [
  {
    id: "client1",
    name: "John Smith",
    company: "Acme Corp",
    email: "john@acme.com",
    phone: "+1 (555) 123-4567",
    address: "123 Business Ave, Tech City, TC 12345",
    industry: "Technology",
    status: "ACTIVE" as const,
    totalProjects: 3,
    totalRevenue: 125000,
    lastContact: "2025-07-05",
    createdAt: "2025-06-01"
  },
  {
    id: "client2", 
    name: "Sarah Johnson",
    company: "Design Studio Pro",
    email: "sarah@designstudio.com",
    phone: "+1 (555) 987-6543",
    industry: "Design",
    status: "ACTIVE" as const,
    totalProjects: 2,
    totalRevenue: 85000,
    lastContact: "2025-07-04",
    createdAt: "2025-05-15"
  }
];

const demoProjects = [
  {
    id: "project1",
    name: "Website Redesign",
    description: "Complete redesign of the company website with modern UI/UX and mobile responsiveness.",
    status: "ACTIVE" as const,
    priority: "HIGH" as const,
    startDate: "2025-07-01",
    endDate: "2025-08-15",
    clientName: "John Smith",
    clientCompany: "Acme Corp",
    teamMembers: 4,
    totalTasks: 24,
    completedTasks: 8,
    budget: 50000,
    spent: 18000,
    progress: 33
  },
  {
    id: "project2",
    name: "Mobile App Development",
    description: "Native mobile app for iOS and Android with user authentication and real-time features.",
    status: "PLANNING" as const,
    priority: "MEDIUM" as const,
    startDate: "2025-08-01",
    endDate: "2025-12-31",
    clientName: "Sarah Johnson",
    clientCompany: "Design Studio Pro",
    teamMembers: 6,
    totalTasks: 45,
    completedTasks: 2,
    budget: 120000,
    spent: 5000,
    progress: 4
  }
];

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
  project: { id: "project1", name: "Website Redesign" },
  board: { id: "board1", name: "Sprint 1" },
  _count: { comments: 3 }
};

const demoInvoices = [
  {
    id: "inv1",
    invoiceNumber: "INV-2025-001",
    clientName: "John Smith",
    clientCompany: "Acme Corp",
    clientEmail: "john@acme.com",
    status: "PAID" as const,
    issueDate: "2025-06-01",
    dueDate: "2025-06-30",
    paidDate: "2025-06-28",
    subtotal: 18000,
    tax: 1440,
    total: 19440,
    currency: "USD",
    projectName: "Website Redesign - Phase 1",
    items: [
      {
        id: "item1",
        description: "UI/UX Design Services",
        quantity: 40,
        rate: 150,
        amount: 6000
      },
      {
        id: "item2", 
        description: "Frontend Development",
        quantity: 60,
        rate: 120,
        amount: 7200
      },
      {
        id: "item3",
        description: "Backend Integration",
        quantity: 32,
        rate: 150,
        amount: 4800
      }
    ],
    notes: "Thank you for your business! Payment received on time."
  },
  {
    id: "inv2",
    invoiceNumber: "INV-2025-002", 
    clientName: "Sarah Johnson",
    clientCompany: "Design Studio Pro",
    clientEmail: "sarah@designstudio.com",
    status: "SENT" as const,
    issueDate: "2025-07-01",
    dueDate: "2025-07-31",
    subtotal: 12000,
    tax: 960,
    total: 12960,
    currency: "USD",
    projectName: "Brand Identity Package",
    items: [
      {
        id: "item4",
        description: "Logo Design & Branding",
        quantity: 20,
        rate: 200,
        amount: 4000
      },
      {
        id: "item5",
        description: "Marketing Materials",
        quantity: 40,
        rate: 100,
        amount: 4000
      },
      {
        id: "item6",
        description: "Style Guide Creation",
        quantity: 20,
        rate: 200,
        amount: 4000
      }
    ]
  }
];

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
              <h3 className="text-xl font-semibold mb-2">Client Management</h3>
              <p className="text-muted-foreground">Start by adding your clients and building strong relationships</p>
            </div>
            <ClientList 
              clients={demoClients}
              onAddClient={() => {}}
              onEditClient={() => {}}
              onViewProjects={() => {}}
            />
            <div className="text-center">
              <Button onClick={handleStepAction} className="gap-2">
                <Building2 className="w-4 h-4" />
                Add New Client
              </Button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Project Portfolio</h3>
              <p className="text-muted-foreground">Create projects for your clients with clear timelines and deliverables</p>
            </div>
            <ProjectList 
              projects={demoProjects}
              onAddProject={() => {}}
              onViewProject={() => {}}
              onEditProject={() => {}}
              onAddTask={() => {}}
            />
            <div className="text-center">
              <Button onClick={handleStepAction} className="gap-2">
                <FolderKanban className="w-4 h-4" />
                Create New Project
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">Invite team members to collaborate on your projects</p>
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
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Task Management</h3>
              <p className="text-muted-foreground">Create boards and assign tasks using our interactive Kanban interface</p>
            </div>
            <BoardComponent />
            <div className="text-center">
              <Button onClick={handleStepAction} className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Create Board
              </Button>
            </div>
          </div>
        );
      
      case 5:
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
                <AlertTriangle className="w-4 w-4" />
                Report Issue
              </Button>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Invoice Management</h3>
              <p className="text-muted-foreground">Create professional invoices and track payments</p>
            </div>
            <InvoiceList 
              invoices={demoInvoices}
              onAddInvoice={() => {}}
              onViewInvoice={() => {}}
              onDownloadInvoice={() => {}}
              onSendInvoice={() => {}}
              onEditInvoice={() => {}}
            />
            <div className="text-center">
              <Button onClick={handleStepAction} className="gap-2">
                <Receipt className="w-4 h-4" />
                Create Invoice
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
              currentStep === 4 && "bg-orange-100 text-orange-600",
              currentStep === 5 && "bg-red-100 text-red-600",
              currentStep === 6 && "bg-indigo-100 text-indigo-600"
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
            Complete workflow mastered! Ready to manage your projects like a pro?
          </div>
        </div>
      )}
    </div>
  );
}
