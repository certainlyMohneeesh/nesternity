"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  DollarSign,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Send,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

interface RecurringInvoiceCardProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    recurrence: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    nextIssueDate: Date;
    autoGenerateEnabled: boolean;
    autoSendEnabled: boolean;
    occurrenceCount: number;
    maxOccurrences: number | null;
    sendDayOfPeriod: number | null;
    recipientEmails: string[];
    taxRate: number;
    discount: number;
    currency: string;
    notes: string | null;
    lastSentDate: Date | null;
    client: {
      id: string;
      name: string;
      email: string;
      company: string | null;
    };
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      rate: number;
      total: number;
    }>;
  };
  onUpdate?: () => void;
}

export default function RecurringInvoiceCard({
  invoice,
  onUpdate,
}: RecurringInvoiceCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(invoice.autoGenerateEnabled);
  const [autoSendEnabled, setAutoSendEnabled] = useState(invoice.autoSendEnabled);

  // Calculate total
  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (invoice.taxRate / 100);
  const discountAmount = subtotal * (invoice.discount / 100);
  const total = subtotal + taxAmount - discountAmount;

  // Format recurrence
  const getRecurrenceLabel = () => {
    const labels = {
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      YEARLY: "Yearly",
    };
    return labels[invoice.recurrence];
  };

  // Get recurrence icon color
  const getRecurrenceColor = () => {
    if (!autoGenerateEnabled) return "text-gray-400";
    const daysUntil = Math.ceil(
      (new Date(invoice.nextIssueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return "text-red-600";
    if (daysUntil < 7) return "text-yellow-600";
    return "text-green-600";
  };

  // Toggle automation
  const handleToggleAutomation = async (field: "autoGenerateEnabled" | "autoSendEnabled", value: boolean) => {
    try {
      setLoading(true);
      console.log('[RecurringInvoiceCard] Toggling automation:', { invoiceId: invoice.id, field, value });

      const response = await fetch(`/api/invoices/recurring/${invoice.id}/toggle-automation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      console.log('[RecurringInvoiceCard] Toggle response:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[RecurringInvoiceCard] Toggle error:', errorData);
        throw new Error("Failed to update automation settings");
      }

      if (field === "autoGenerateEnabled") {
        setAutoGenerateEnabled(value);
      } else {
        setAutoSendEnabled(value);
      }

      toast.success("Automation settings updated");
      onUpdate?.();
      router.refresh();
    } catch (error) {
      console.error("[RecurringInvoiceCard] Failed to toggle automation:", error);
      toast.error("Failed to update settings");
      
      // Revert state
      if (field === "autoGenerateEnabled") {
        setAutoGenerateEnabled(!value);
      } else {
        setAutoSendEnabled(!value);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate invoice now
  const handleGenerateNow = async () => {
    try {
      setLoading(true);
      console.log('[RecurringInvoiceCard] Generating invoice now for:', invoice.id);

      const response = await fetch(`/api/invoices/recurring/${invoice.id}/process`, {
        method: "POST",
      });

      console.log('[RecurringInvoiceCard] Generate response:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[RecurringInvoiceCard] Generate error:', error);
        throw new Error(error.error || "Failed to generate invoice");
      }

      const data = await response.json();
      console.log('[RecurringInvoiceCard] Generated invoice:', data.invoice.invoiceNumber);

      toast.success("Invoice generated!", {
        description: `Created ${data.invoice.invoiceNumber}`,
        action: {
          label: "View",
          onClick: () => router.push(`/dashboard/invoices/${data.invoice.id}`),
        },
      });

      onUpdate?.();
      router.refresh();
    } catch (error) {
      console.error("[RecurringInvoiceCard] Failed to generate invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  // Delete recurring invoice
  const handleDelete = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recurring invoice");
      }

      toast.success("Recurring invoice deleted");
      onUpdate?.();
      router.refresh();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete recurring invoice");
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Calculate progress
  const progress = invoice.maxOccurrences
    ? (invoice.occurrenceCount / invoice.maxOccurrences) * 100
    : null;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                <Badge variant={autoGenerateEnabled ? "default" : "secondary"}>
                  {getRecurrenceLabel()}
                </Badge>
                {!autoGenerateEnabled && (
                  <Badge variant="outline" className="text-orange-600">
                    Paused
                  </Badge>
                )}
              </div>
              <CardDescription>
                {invoice.client.name}
                {invoice.client.company && ` • ${invoice.client.company}`}
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleGenerateNow}>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Template
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Amount */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Invoice Amount</span>
            </div>
            <span className="text-lg font-bold">
              {invoice.currency} {total.toFixed(2)}
            </span>
          </div>

          {/* Next Issue Date */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className={`h-5 w-5 ${getRecurrenceColor()}`} />
              <div>
                <p className="text-sm font-medium">Next Invoice</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(invoice.nextIssueDate), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {formatDistanceToNow(new Date(invoice.nextIssueDate), { addSuffix: true })}
              </p>
              {invoice.sendDayOfPeriod && (
                <p className="text-xs text-muted-foreground">
                  Day {invoice.sendDayOfPeriod}
                </p>
              )}
            </div>
          </div>

          {/* Progress */}
          {invoice.maxOccurrences && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {invoice.occurrenceCount} / {invoice.maxOccurrences}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Items Preview */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Items:</p>
            {invoice.items.slice(0, 2).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate">
                  {item.description} (x{item.quantity})
                </span>
                <span className="font-medium ml-2">
                  {invoice.currency} {item.total.toFixed(2)}
                </span>
              </div>
            ))}
            {invoice.items.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{invoice.items.length - 2} more item{invoice.items.length - 2 > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Automation Toggles */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor={`auto-generate-${invoice.id}`} className="text-sm cursor-pointer">
                  Auto-Generate
                </Label>
              </div>
              <Switch
                id={`auto-generate-${invoice.id}`}
                checked={autoGenerateEnabled}
                onCheckedChange={(checked) => handleToggleAutomation("autoGenerateEnabled", checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor={`auto-send-${invoice.id}`} className="text-sm cursor-pointer">
                  Auto-Send Email
                </Label>
              </div>
              <Switch
                id={`auto-send-${invoice.id}`}
                checked={autoSendEnabled}
                onCheckedChange={(checked) => handleToggleAutomation("autoSendEnabled", checked)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Last Sent */}
          {invoice.lastSentDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              Last sent {formatDistanceToNow(new Date(invoice.lastSentDate), { addSuffix: true })}
            </div>
          )}

          {/* Warnings */}
          {new Date(invoice.nextIssueDate) < new Date() && autoGenerateEnabled && (
            <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-yellow-800">
                Invoice is overdue. It will be generated in the next cron run.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleGenerateNow}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Generate Invoice Now
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the recurring invoice template "{invoice.invoiceNumber}". 
              Previously generated invoices will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
