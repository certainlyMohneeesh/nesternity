"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Sparkles, 
  FileText, 
  Calculator, 
  Mail, 
  AlertTriangle,
  ArrowRight,
  Zap,
  TrendingUp
} from "lucide-react";

export default function AIFeaturesPage() {
  const params = useParams();
  const orgId = params.id as string;
  const projectId = params.projectId as string;
  
  const aiFeatures = [
    {
      title: "Smart Proposals",
      description: "Generate professional, detailed proposals from client briefs using AI. Includes scope, deliverables, timeline, and pricing.",
      icon: FileText,
      href: `/dashboard/organisation/${orgId}/projects/${projectId}/proposals/new`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      status: "Active",
      stats: "Save 2-3 hours per proposal"
    },
    {
      title: "AI Budget Estimation",
      description: "Automatically estimate proposal budgets based on deliverables, timeline, and historical data. Integrated directly into proposal creation.",
      icon: Calculator,
      href: `/dashboard/organisation/${orgId}/projects/${projectId}/proposals/new`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      status: "Active",
      stats: "Smart learning from history"
    },
    {
      title: "Weekly Updates",
      description: "Auto-generate professional client update emails with accomplishments, blockers, and next steps.",
      icon: Mail,
      href: "/dashboard/ai/updates",
      color: "text-green-600",
      bgColor: "bg-green-50",
      status: "Active",
      stats: "Draft updates in 30 seconds"
    },
    {
      title: "Scope Sentinel",
      description: "Detect scope creep automatically and get AI-drafted change orders with risk analysis and recommendations.",
      icon: AlertTriangle,
      href: "/dashboard/ai/scope-sentinel",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      status: "Active",
      stats: "Prevent budget overruns"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "10x Faster",
      description: "Complete tasks in minutes that used to take hours"
    },
    {
      icon: TrendingUp,
      title: "Data-Driven",
      description: "Leverage historical data for accurate insights"
    },
    {
      icon: Sparkles,
      title: "Smart AI",
      description: "Powered by Google Gemini 2.5 Flash"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Features
          </h1>
          <p className="text-muted-foreground mt-2">
            Supercharge your workflow with AI-powered automation
          </p>
        </div>
      </div>

      {/* Benefits Banner */}
      <div className="grid gap-4 md:grid-cols-3">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <Card key={benefit.title} className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Features Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                    {feature.status}
                  </span>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{feature.stats}</span>
                  </div>
                  <Link href={feature.href}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="group-hover:translate-x-1 transition-transform"
                    >
                      Try it
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Getting Started */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">1. Start with Proposals</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Generate your first AI proposal to see the magic in action.
              </p>
              <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/proposals/new`}>
                <Button size="sm">
                  Generate Proposal
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Auto-Estimate Budgets</h4>
              <p className="text-sm text-muted-foreground mb-3">
                When creating or editing proposals, AI automatically suggests budgets based on your project scope.
              </p>
              <Link href="/dashboard/proposals">
                <Button size="sm" variant="outline">
                  View Proposals
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Our AI features are powered by Google Gemini 2.5 Flash
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-lg font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold mb-1">Input</h4>
              <p className="text-sm text-muted-foreground">
                Provide project details or client information
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-lg font-bold text-primary">2</span>
              </div>
              <h4 className="font-semibold mb-1">AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Gemini AI processes and analyzes your data
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-lg font-bold text-primary">3</span>
              </div>
              <h4 className="font-semibold mb-1">Generate</h4>
              <p className="text-sm text-muted-foreground">
                Get professional outputs in seconds
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-lg font-bold text-primary">4</span>
              </div>
              <h4 className="font-semibold mb-1">Refine</h4>
              <p className="text-sm text-muted-foreground">
                Review, edit, and save your work
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
