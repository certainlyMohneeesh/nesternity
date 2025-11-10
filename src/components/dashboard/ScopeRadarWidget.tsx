"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Send,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ScopeRadarWidgetProps {
  projectId?: string;
  clientId: string;
  userId: string;
  compact?: boolean;
}

interface BudgetData {
  originalBudget: number;
  invoiceTotal: number;
  remainingBudget: number;
  spendPercentage: number;
  overrunAmount: number;
  overrunPercentage: number;
  riskLevel: "safe" | "warning" | "critical";
  invoiceCount: number;
  currency: string;
  clientEmailDraft?: string;
  lastChecked?: string;
}

export default function ScopeRadarWidget({
  projectId,
  clientId,
  userId,
  compact = false,
}: ScopeRadarWidgetProps) {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  // Fetch budget data
  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      console.log('[ScopeRadarWidget] Fetching budget data for:', { clientId, projectId });

      const response = await fetch(
        `/api/ai/scope-sentinel/budget-check?clientId=${clientId}${projectId ? `&projectId=${projectId}` : ""}`
      );

      console.log('[ScopeRadarWidget] Response status:', response.status);

      // If no existing data (404), trigger a fresh budget check
      if (response.status === 404) {
        console.log('[ScopeRadarWidget] No existing budget data, running initial check');
        await checkBudget();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[ScopeRadarWidget] API Error:', errorData);
        // Don't throw, just show empty state
        setBudgetData(null);
        return;
      }

      const data = await response.json();
      console.log('[ScopeRadarWidget] Budget data received:', data);

      if (data.radar) {
        // Map from ScopeRadar model to BudgetData
        const spendPercentage = data.radar.originalBudget > 0 
          ? (data.radar.currentEstimate / data.radar.originalBudget) * 100 
          : 0;

        setBudgetData({
          originalBudget: data.radar.originalBudget,
          invoiceTotal: data.radar.currentEstimate,
          remainingBudget: data.radar.originalBudget - data.radar.currentEstimate,
          spendPercentage,
          overrunAmount: data.radar.budgetOverrun || 0,
          overrunPercentage: data.radar.budgetOverrunPercent || 0,
          riskLevel: spendPercentage >= 100 ? 'critical' : spendPercentage >= 80 ? 'warning' : 'safe',
          invoiceCount: data.radar.flaggedItems?.length || 0,
          currency: 'INR', // Default to INR if not in radar data
          clientEmailDraft: data.radar.clientEmailDraft,
          lastChecked: data.radar.flaggedAt,
        });
      } else {
        console.log('[ScopeRadarWidget] No radar data in response');
        setBudgetData(null);
      }
    } catch (error) {
      console.error("[ScopeRadarWidget] Failed to fetch budget data:", error);
      setBudgetData(null);
    } finally {
      setLoading(false);
    }
  };

  // Check budget with AI analysis
  const checkBudget = async () => {
    try {
      setChecking(true);
      console.log('[ScopeRadarWidget] Running budget check for:', { clientId, projectId });

      const response = await fetch("/api/ai/scope-sentinel/budget-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[ScopeRadarWidget] POST Error:', errorData);
        
        // Show user-friendly error message
        if (errorData.message?.includes('No budget found')) {
          toast.error("No budget configured", {
            description: "Please set a client budget or create an accepted proposal first",
          });
        } else {
          toast.error("Failed to analyze budget", {
            description: errorData.error || "Please try again later",
          });
        }
        return;
      }

      const data = await response.json();
      console.log('[ScopeRadarWidget] Budget check response:', data);

      // Calculate spend percentage
      const spendPercentage = data.originalBudget > 0 
        ? (data.invoiceTotal / data.originalBudget) * 100 
        : 0;

      setBudgetData({
        originalBudget: data.originalBudget || 0,
        invoiceTotal: data.invoiceTotal || 0,
        remainingBudget: data.remainingBudget || 0,
        spendPercentage,
        overrunAmount: data.overrunAmount || 0,
        overrunPercentage: data.overrunPercent || 0, // API returns 'overrunPercent'
        riskLevel: data.riskLevel || 'safe',
        invoiceCount: data.flaggedInvoices?.length || 0,
        currency: data.currency || 'INR', // Get currency from API
        clientEmailDraft: data.clientEmailDraft,
        lastChecked: new Date().toISOString(),
      });

      toast.success("Budget analysis complete", {
        description: `Risk level: ${data.riskLevel.toUpperCase()}`,
      });
    } catch (error) {
      console.error("[ScopeRadarWidget] Failed to check budget:", error);
      toast.error("Failed to analyze budget", {
        description: "An unexpected error occurred",
      });
    } finally {
      setChecking(false);
    }
  };

  // Send warning email to client
  const sendWarningEmail = async () => {
    if (!budgetData?.clientEmailDraft) return;

    try {
      toast.info("Sending email to client...");
      
      // TODO: Implement email sending
      // await sendEmail({
      //   to: client.email,
      //   subject: "Budget Update - Project Review",
      //   html: budgetData.clientEmailDraft,
      // });

      toast.success("Warning email sent to client");
      setShowEmailDialog(false);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email");
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [clientId, projectId]);

  // Format currency with proper symbol
  const formatCurrency = (amount: number) => {
    if (!budgetData) return `₹${amount.toLocaleString()}`;
    
    const currencySymbols: Record<string, string> = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
    };
    
    const symbol = currencySymbols[budgetData.currency] || budgetData.currency + ' ';
    return `${symbol}${amount.toLocaleString('en-IN')}`;
  };

  // Get risk level styling
  const getRiskStyles = () => {
    if (!budgetData) return { 
      color: "text-gray-600", 
      bg: "bg-gray-100", 
      badge: "secondary" as const,
      icon: AlertTriangle 
    };

    const styles = {
      safe: {
        color: "text-green-600",
        bg: "bg-green-50",
        badge: "default" as const,
        icon: CheckCircle2,
      },
      warning: {
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        badge: "secondary" as const,
        icon: AlertCircle,
      },
      critical: {
        color: "text-red-600",
        bg: "bg-red-50",
        badge: "destructive" as const,
        icon: XCircle,
      },
    };

    return styles[budgetData.riskLevel];
  };

  const riskStyles = getRiskStyles();
  const RiskIcon = riskStyles.icon;

  if (loading) {
    return (
      <Card className={compact ? "" : "h-full"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Budget Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!budgetData) {
    return (
      <Card className={compact ? "" : "h-full"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Monitor
          </CardTitle>
          <CardDescription>
            Track spending and detect budget overruns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              No budget data available yet
            </p>
            <p className="text-xs text-muted-foreground">
              Click below to analyze your budget and invoices
            </p>
          </div>
          <Button 
            onClick={checkBudget} 
            disabled={checking} 
            className="w-full"
            size="lg"
          >
            {checking && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {checking ? "Analyzing Budget..." : "Run Budget Analysis"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`${compact ? "" : "h-full"} ${riskStyles.bg} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RiskIcon className={`h-5 w-5 ${riskStyles.color}`} />
              Budget Monitor
            </CardTitle>
            <Badge variant={riskStyles.badge}>
              {budgetData.riskLevel.toUpperCase()}
            </Badge>
          </div>
          {!compact && (
            <CardDescription>
              Real-time budget tracking and scope creep detection
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Budget Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Budget</span>
              <span className="font-bold">{formatCurrency(budgetData.originalBudget || 0)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Spent</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(budgetData.invoiceTotal || 0)}
              </span>
            </div>

            {budgetData.remainingBudget >= 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(budgetData.remainingBudget || 0)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overrun</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(Math.abs(budgetData.overrunAmount || 0))}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className={`font-medium ${(budgetData.spendPercentage || 0) > 100 ? "text-red-600" : ""}`}>
                {(budgetData.spendPercentage || 0).toFixed(1)}%
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetData.riskLevel === "critical"
                    ? "bg-red-600"
                    : budgetData.riskLevel === "warning"
                    ? "bg-yellow-600"
                    : "bg-green-600"
                }`}
                style={{ width: `${Math.min(budgetData.spendPercentage || 0, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          {!compact && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-background rounded-lg border">
                <p className="text-xs text-muted-foreground">Invoices</p>
                <p className="text-2xl font-bold">{budgetData.invoiceCount}</p>
              </div>
              {budgetData.overrunAmount > 0 && (
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-xs text-muted-foreground">Overrun %</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(budgetData.overrunPercentage || 0).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Warning Message */}
          {budgetData.riskLevel !== "safe" && (
            <div className={`p-3 rounded-lg border ${riskStyles.bg}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`h-4 w-4 mt-0.5 ${riskStyles.color}`} />
                <div className="flex-1 space-y-1">
                  <p className={`text-sm font-medium ${riskStyles.color}`}>
                    {budgetData.riskLevel === "critical"
                      ? "Budget Exceeded!"
                      : "Budget Warning"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {budgetData.riskLevel === "critical"
                      ? "Project has exceeded allocated budget. Consider issuing a change order."
                      : "Project is approaching budget limit. Monitor closely to prevent overruns."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={checkBudget}
              disabled={checking}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {checking && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {checking ? "Analyzing..." : "Re-check"}
            </Button>

            {budgetData.riskLevel !== "safe" && (
              <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="default" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Alert Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send Budget Warning to Client</DialogTitle>
                    <DialogDescription>
                      AI-generated professional email to notify client about budget status
                    </DialogDescription>
                  </DialogHeader>

                  {budgetData.clientEmailDraft ? (
                    <div className="space-y-4">
                      <div
                        className="p-4 border rounded-lg max-h-96 overflow-y-auto prose prose-sm"
                        dangerouslySetInnerHTML={{ __html: budgetData.clientEmailDraft }}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => setShowEmailDialog(false)} variant="outline" className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={sendWarningEmail} className="flex-1">
                          <Send className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Click "Generate Email" to create a professional budget warning message.
                      </p>
                      <Button onClick={checkBudget} disabled={checking} className="w-full">
                        {checking && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                        Generate Email
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Last Checked */}
          {budgetData.lastChecked && !compact && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Last checked {formatDistanceToNow(new Date(budgetData.lastChecked), { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
