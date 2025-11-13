import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import RecurringInvoiceCard from "@/components/invoices/RecurringInvoiceCard";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, DollarSign, RefreshCw, Home, FileText } from "lucide-react";
import Link from "next/link";
import { getCurrencySymbol } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export default async function RecurringInvoicesPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: orgId, projectId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userId = user.id;
  console.log('[RecurringInvoicesPage] Fetching recurring invoices for user:', userId);

  // Fetch all recurring invoices for the user
  const recurringInvoices = await prisma.invoice.findMany({
    where: {
      issuedById: userId,
      isRecurring: true,
    },
    include: {
      items: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
    },
    orderBy: {
      nextIssueDate: "asc",
    },
  });

  console.log('[RecurringInvoicesPage] Found recurring invoices:', recurringInvoices.length);

  // Calculate stats
  const activeInvoices = recurringInvoices.filter(inv => inv.autoGenerateEnabled);
  
  // Calculate total recurring value with currency information
  const recurringValueByCurrency = recurringInvoices.reduce((acc, inv) => {
    const subtotal = inv.items.reduce((s, item) => s + item.total, 0);
    const tax = subtotal * ((inv.taxRate || 0) / 100);
    const discount = subtotal * ((inv.discount || 0) / 100);
    const total = subtotal + tax - discount;
    
    const currency = inv.currency || 'USD';
    acc[currency] = (acc[currency] || 0) + total;
    return acc;
  }, {} as Record<string, number>);

  // Get primary currency (most common or first)
  const primaryCurrency = Object.keys(recurringValueByCurrency)[0] || 'USD';
  const totalRecurringValue = recurringValueByCurrency[primaryCurrency] || 0;
  const currencySymbol = getCurrencySymbol(primaryCurrency);

  const upcomingThisWeek = recurringInvoices.filter(inv => {
    if (!inv.nextIssueDate) return false;
    const nextDate = new Date(inv.nextIssueDate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return nextDate <= weekFromNow && inv.autoGenerateEnabled;
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/invoices">
              <FileText className="h-4 w-4 mr-1" />
              Invoices
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Recurring</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recurring Invoices</h1>
          <p className="text-muted-foreground mt-2">
            Automate your billing with recurring invoice templates
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices`}>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              All Invoices
            </Button>
          </Link>
          <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/recurring/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Recurring Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Templates</p>
              <p className="text-3xl font-bold">{activeInvoices.length}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Recurring Value</p>
              <p className="text-3xl font-bold">
                {currencySymbol}{totalRecurringValue.toLocaleString()}
              </p>
              {Object.keys(recurringValueByCurrency).length > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Multiple currencies
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due This Week</p>
              <p className="text-3xl font-bold">{upcomingThisWeek.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Grid */}
      {recurringInvoices.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recurringInvoices
            .filter(invoice => invoice.recurrence !== null && invoice.nextIssueDate !== null)
            .map((invoice) => (
              <RecurringInvoiceCard
                key={invoice.id}
                invoice={{
                  ...invoice,
                  recurrence: invoice.recurrence!,
                  nextIssueDate: new Date(invoice.nextIssueDate!),
                  lastSentDate: invoice.lastSentDate ? new Date(invoice.lastSentDate) : null,
                  taxRate: invoice.taxRate || 0,
                  discount: invoice.discount || 0,
                }}
              />
            ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <RefreshCw className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Recurring Invoices Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first recurring invoice template to automate your billing process.
            Invoices will be generated and sent automatically based on your schedule.
          </p>
          <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/recurring/new`}>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Recurring Invoice
            </Button>
          </Link>
        </div>
      )}

      {/* Info Card */}
      {recurringInvoices.length > 0 && (
        <div className="p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">How It Works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Invoices are automatically generated based on your recurrence schedule</li>
            <li>• Enable auto-send to email invoices to clients with AI-generated messages</li>
            <li>• Set max occurrences to automatically stop after a certain number of invoices</li>
            <li>• Use "Generate Now" to manually create an invoice before the scheduled date</li>
            <li>• Toggle automation on/off anytime without deleting the template</li>
          </ul>
        </div>
      )}
    </div>
  );
}
