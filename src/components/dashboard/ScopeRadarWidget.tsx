"use client";

import { useState, useEffect } from "react";
import { getCurrencySymbol, formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Edit3,
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

interface UserDetails {
  name: string;
  title: string;
  company: string;
}

interface EmailData {
  subject: string;
  body: string;
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
  const [editMode, setEditMode] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "",
    title: "",
    company: "",
  });
  const [emailData, setEmailData] = useState<EmailData>({
    subject: "",
    body: "",
  });

  // Fetch user details for email signature
  const fetchUserDetails = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserDetails({
          name: data.displayName || data.email?.split('@')[0] || "Your Name",
          title: "Project Manager", // Default title
          company: "Nesternity", // Default company
        });
      }
    } catch (error) {
      console.error('[ScopeRadarWidget] Failed to fetch user details:', error);
    }
  };

  // Parse HTML email to extract subject and body
  const parseEmailContent = (htmlContent: string): EmailData => {
    // Extract subject if it exists in the HTML
    const subjectMatch = htmlContent.match(/<p><b>Subject:?\s*<\/b>\s*(.*?)<\/p>/i) ||
      htmlContent.match(/Subject:\s*(.*?)(?:<\/p>|<br>|\n)/i);

    let subject = "Urgent: Project Budget Status Update";
    let body = htmlContent;

    if (subjectMatch) {
      subject = subjectMatch[1].trim().replace(/<[^>]*>/g, '');
      // Remove subject line from body
      body = htmlContent.replace(subjectMatch[0], '').trim();
    }

    return { subject, body };
  };

  // Replace placeholders in email with actual user details
  const fillEmailPlaceholders = (emailHtml: string): string => {
    return emailHtml
      .replace(/\[Your Name\/Project Manager Name\]/g, userDetails.name)
      .replace(/\[Your Name\]/g, userDetails.name)
      .replace(/\[Your Title\]/g, userDetails.title)
      .replace(/\[Your Company\]/g, userDetails.company)
      .replace(/\[Project Manager Name\]/g, userDetails.name);
  };

  // Convert HTML to plain text for editing
  const htmlToPlainText = (html: string): string => {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p>/gi, '')
      .replace(/<b>(.*?)<\/b>/gi, '$1')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  // Convert plain text to HTML
  const plainTextToHtml = (text: string): string => {
    return text
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('');
  };

  // Initialize user details on mount
  useEffect(() => {
    fetchUserDetails();
  }, []);

  // Update email data when budget data changes
  useEffect(() => {
    if (budgetData?.clientEmailDraft) {
      const filledEmail = fillEmailPlaceholders(budgetData.clientEmailDraft);
      const parsed = parseEmailContent(filledEmail);
      setEmailData(parsed);
      setEditMode(false);
    }
  }, [budgetData?.clientEmailDraft, userDetails]);

  // Fetch budget data (only cached results, no AI check)
  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      console.log('[ScopeRadarWidget] Fetching cached budget data for:', { clientId, projectId });

      const response = await fetch(
        `/api/ai/scope-sentinel/budget-check?clientId=${clientId}${projectId ? `&projectId=${projectId}` : ""}`
      );

      console.log('[ScopeRadarWidget] Response status:', response.status);

      // If no existing data (404), show empty state - don't auto-trigger AI check
      if (response.status === 404) {
        console.log('[ScopeRadarWidget] No existing budget data - user can manually check');
        setBudgetData(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[ScopeRadarWidget] API Error:', errorData);
        setBudgetData(null);
        setLoading(false);
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
          currency: data.currency || 'INR', // Use currency from API response
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
  const checkBudget = async (showToast = true) => {
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

      // Only show toast if explicitly requested (manual re-check)
      if (showToast) {
        toast.success("Budget analysis complete", {
          description: `Risk level: ${data.riskLevel.toUpperCase()}`,
        });
      }
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
    if (!emailData.body) {
      console.error('[ScopeRadarWidget] Cannot send email: emailData.body is empty');
      toast.error("Email content is missing");
      return;
    }

    if (!clientId) {
      console.error('[ScopeRadarWidget] Cannot send email: clientId is missing');
      toast.error("Client information is missing");
      return;
    }

    try {
      console.log('[ScopeRadarWidget] Preparing to send budget warning email:', {
        clientId,
        subject: emailData.subject,
        senderName: userDetails.name,
        senderTitle: userDetails.title,
        senderCompany: userDetails.company,
        bodyLength: emailData.body.length,
      });

      toast.info("Sending email to client...");

      // Fill placeholders one more time before sending
      const finalEmailBody = fillEmailPlaceholders(emailData.body);

      console.log('[ScopeRadarWidget] Calling email API...');
      const response = await fetch('/api/email/budget-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          subject: emailData.subject,
          htmlContent: finalEmailBody,
          senderName: userDetails.name,
          senderTitle: userDetails.title,
          senderCompany: userDetails.company,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[ScopeRadarWidget] Email API error:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData.error,
          details: responseData.details,
          requestId: responseData.requestId,
        });

        toast.error("Failed to send email", {
          description: responseData.details || responseData.error || "Please try again later",
        });
        return;
      }

      console.log('[ScopeRadarWidget] ✅ Email sent successfully:', {
        emailId: responseData.emailId,
        recipient: responseData.recipient,
        duration: responseData.duration,
      });

      toast.success("Budget warning email sent!", {
        description: `Sent to ${responseData.recipient?.name || 'client'}`,
      });

      setShowEmailDialog(false);
      setEditMode(false);
    } catch (error) {
      console.error('[ScopeRadarWidget] ❌ Failed to send email:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      toast.error("Failed to send email", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  };

  // Only fetch cached data on mount, don't auto-trigger expensive AI checks
  useEffect(() => {
    fetchBudgetData();
  }, [clientId, projectId]);

  // Format currency helper
  const formatBudgetCurrency = (amount: number) => {
    if (!budgetData) return formatCurrency(amount, 'INR');
    return formatCurrency(amount, budgetData.currency);
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
            onClick={() => checkBudget(true)}
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
              <span className="font-bold">{formatBudgetCurrency(budgetData.originalBudget || 0)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Spent</span>
              <span className="font-bold text-blue-600">
                {formatBudgetCurrency(budgetData.invoiceTotal || 0)}
              </span>
            </div>

            {budgetData.remainingBudget >= 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span className="font-bold text-green-600">
                  {formatBudgetCurrency(budgetData.remainingBudget || 0)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overrun</span>
                <span className="font-bold text-red-600">
                  {formatBudgetCurrency(Math.abs(budgetData.overrunAmount || 0))}
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
                className={`h-full rounded-full transition-all ${budgetData.riskLevel === "critical"
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
              onClick={() => checkBudget(true)}
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
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Send Budget Warning to Client</DialogTitle>
                    <DialogDescription>
                      AI-generated professional email to notify client about budget status
                    </DialogDescription>
                  </DialogHeader>

                  {budgetData.clientEmailDraft ? (
                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                      {!editMode ? (
                        <>
                          {/* Preview Mode */}
                          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
                            {/* Subject Line */}
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-muted-foreground">Subject</Label>
                              <div className="text-sm font-semibold p-3 bg-muted/50 rounded-md border">
                                {emailData.subject}
                              </div>
                            </div>

                            {/* Email Body Preview */}
                            <div className="flex-1 overflow-hidden flex flex-col space-y-1">
                              <Label className="text-xs font-semibold text-muted-foreground">Email Content</Label>
                              <div
                                className="flex-1 p-4 border rounded-md overflow-y-auto prose prose-sm max-w-none bg-white"
                                dangerouslySetInnerHTML={{ __html: emailData.body }}
                              />
                            </div>
                          </div>

                          {/* User Details (Editable) */}
                          <div className="border-t pt-3">
                            <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Email Signature</Label>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor="senderName" className="text-xs">Your Name</Label>
                                <Input
                                  id="senderName"
                                  value={userDetails.name}
                                  onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                                  className="h-8 text-sm"
                                  placeholder="John Doe"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="senderTitle" className="text-xs">Your Title</Label>
                                <Input
                                  id="senderTitle"
                                  value={userDetails.title}
                                  onChange={(e) => setUserDetails({ ...userDetails, title: e.target.value })}
                                  className="h-8 text-sm"
                                  placeholder="Project Manager"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="senderCompany" className="text-xs">Company</Label>
                                <Input
                                  id="senderCompany"
                                  value={userDetails.company}
                                  onChange={(e) => setUserDetails({ ...userDetails, company: e.target.value })}
                                  className="h-8 text-sm"
                                  placeholder="Your Company"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 border-t pt-3">
                            <Button onClick={() => setShowEmailDialog(false)} variant="outline" size="sm">
                              Cancel
                            </Button>
                            <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Email
                            </Button>
                            <Button onClick={sendWarningEmail} size="sm" className="ml-auto">
                              <Send className="h-4 w-4 mr-2" />
                              Send Email
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Edit Mode */}
                          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
                            {/* Subject Editor */}
                            <div className="space-y-1">
                              <Label htmlFor="emailSubject" className="text-xs font-semibold">Subject</Label>
                              <Input
                                id="emailSubject"
                                value={emailData.subject}
                                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                                className="text-sm"
                                placeholder="Email subject..."
                              />
                            </div>

                            {/* Body Editor */}
                            <div className="flex-1 overflow-hidden flex flex-col space-y-1">
                              <Label htmlFor="emailBody" className="text-xs font-semibold">Email Content</Label>
                              <Textarea
                                id="emailBody"
                                value={htmlToPlainText(emailData.body)}
                                onChange={(e) => setEmailData({ ...emailData, body: plainTextToHtml(e.target.value) })}
                                className="flex-1 text-sm resize-none"
                                placeholder="Type your email content here..."
                              />
                              <p className="text-xs text-muted-foreground">
                                Edit your email content. Formatting will be preserved when sent.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 border-t pt-3">
                            <Button onClick={() => {
                              // Reset to filled template
                              if (budgetData?.clientEmailDraft) {
                                const filledEmail = fillEmailPlaceholders(budgetData.clientEmailDraft);
                                const parsed = parseEmailContent(filledEmail);
                                setEmailData(parsed);
                              }
                              setEditMode(false);
                            }} variant="outline" size="sm">
                              Cancel Edit
                            </Button>
                            <Button onClick={() => setEditMode(false)} variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button onClick={sendWarningEmail} size="sm" className="ml-auto">
                              <Send className="h-4 w-4 mr-2" />
                              Send Email
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Click "Generate Email" to create a professional budget warning message.
                      </p>
                      <Button onClick={() => checkBudget(true)} disabled={checking} className="w-full">
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
