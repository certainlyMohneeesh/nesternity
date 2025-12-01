"use client";

import { useRouter } from "next/navigation";
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
import {
  Calendar,
  DollarSign,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

interface RecurringInvoicesOverviewProps {
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    recurrence: string;
    nextIssueDate: Date;
    autoGenerateEnabled: boolean;
    autoSendEnabled: boolean;
    occurrenceCount: number;
    maxOccurrences: number | null;
    currency: string;
    client: {
      name: string;
      company: string | null;
    };
    items: Array<{
      total: number;
    }>;
    taxRate: number;
    discount: number;
  }>;
  orgId: string;
  projectId: string;
}

export default function RecurringInvoicesOverview({
  invoices,
  orgId,
  projectId,
}: RecurringInvoicesOverviewProps) {
  const router = useRouter();

  // Calculate stats
  const activeCount = invoices.filter((inv) => inv.autoGenerateEnabled).length;
  const upcomingThisWeek = invoices.filter((inv) => {
    const nextDate = new Date(inv.nextIssueDate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return nextDate <= weekFromNow && inv.autoGenerateEnabled;
  });

  // Calculate total monthly value with currency awareness
  const monthlyValueByCurrency = invoices
    .filter((inv) => inv.autoGenerateEnabled)
    .reduce((acc, inv) => {
      const subtotal = inv.items.reduce((s, item) => s + item.total, 0);
      const tax = subtotal * (inv.taxRate / 100);
      const discount = subtotal * (inv.discount / 100);
      const total = subtotal + tax - discount;

      let monthlyValue = 0;

      // Check if invoice has limited occurrences
      if (inv.maxOccurrences) {
        const remainingOccurrences = inv.maxOccurrences - inv.occurrenceCount;

        if (remainingOccurrences > 0) {
          // For limited invoices, only count recurring value if they'll repeat this month
          // Otherwise this inflates the "monthly" value misleadingly
          const daysToComplete = {
            WEEKLY: remainingOccurrences * 7,
            MONTHLY: remainingOccurrences * 30,
            QUARTERLY: remainingOccurrences * 90,
            YEARLY: remainingOccurrences * 365,
          }[inv.recurrence] || 30;

          if (daysToComplete <= 30) {
            // Will complete within a month - count total remaining value
            monthlyValue = total * remainingOccurrences;
          } else {
            // Spreads across multiple months - use standard monthly equivalent
            const multiplier = {
              WEEKLY: 4.33,
              MONTHLY: 1,
              QUARTERLY: 0.33,
              YEARLY: 0.083,
            }[inv.recurrence] || 1;
            monthlyValue = total * multiplier;
          }
        }
        // else: no remaining occurrences, monthlyValue stays 0
      } else {
        // Unlimited recurring invoice - use standard monthly equivalent
        const multiplier = {
          WEEKLY: 4.33,
          MONTHLY: 1,
          QUARTERLY: 0.33,
          YEARLY: 0.083,
        }[inv.recurrence] || 1;
        monthlyValue = total * multiplier;
      }

      const currency = inv.currency || 'USD';
      acc[currency] = (acc[currency] || 0) + monthlyValue;

      return acc;
    }, {} as Record<string, number>);

  // Get primary currency (most common or first)
  const primaryCurrency = Object.keys(monthlyValueByCurrency)[0] || 'USD';
  const totalMonthlyValue = monthlyValueByCurrency[primaryCurrency] || 0;
  const monthlyCurrencySymbol = getCurrencySymbol(primaryCurrency);

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recurring Invoices
          </CardTitle>
          <CardDescription>Automate your billing process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No recurring invoices set up yet
            </p>
            <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/recurring/new`}>
              <Button size="sm">
                Create Recurring Invoice
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Recurring Invoices
            </CardTitle>
            <CardDescription>
              Automated billing overview
            </CardDescription>
          </div>
          <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/recurring`}>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold">
              {monthlyCurrencySymbol}{Math.round(totalMonthlyValue).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Monthly{Object.keys(monthlyValueByCurrency).length > 1 ? ' (mixed)' : ''}
            </p>
          </div>

          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold">{upcomingThisWeek.length}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
        </div>

        {/* Upcoming Invoices */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Next Up</h4>
          {invoices
            .filter((inv) => inv.autoGenerateEnabled)
            .slice(0, 3)
            .map((invoice) => {
              const subtotal = invoice.items.reduce((s, item) => s + item.total, 0);
              const tax = subtotal * (invoice.taxRate / 100);
              const discount = subtotal * (invoice.discount / 100);
              const total = subtotal + tax - discount;

              const daysUntil = Math.ceil(
                (new Date(invoice.nextIssueDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/${invoice.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {invoice.client.name}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {invoice.recurrence}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {daysUntil < 0
                          ? "Overdue"
                          : daysUntil === 0
                            ? "Today"
                            : daysUntil === 1
                              ? "Tomorrow"
                              : `in ${daysUntil} days`}
                      </p>
                      {invoice.autoSendEnabled && (
                        <Badge variant="secondary" className="text-xs">
                          Auto-send
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-sm">
                      {getCurrencySymbol(invoice.currency)}{total.toFixed(0)}
                    </p>
                    {invoice.maxOccurrences && (
                      <p className="text-xs text-muted-foreground">
                        {invoice.occurrenceCount}/{invoice.maxOccurrences}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* View All Link */}
        {invoices.length > 3 && (
          <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/recurring`}>
            <Button variant="outline" className="w-full">
              View All {invoices.length} Recurring Invoices
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
