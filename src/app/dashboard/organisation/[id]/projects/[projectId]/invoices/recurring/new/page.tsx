import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import RecurringInvoiceForm from "@/components/invoices/RecurringInvoiceForm";
import { ArrowLeft, Home, FileText } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export default async function NewRecurringInvoicePage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: orgId, projectId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userId = user.id;
  console.log('[NewRecurringInvoicePage] Fetching clients for user:', userId);

  // Fetch user's clients
  const clients = await prisma.client.findMany({
    where: {
      createdBy: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log('[NewRecurringInvoicePage] Found clients:', clients.length);

  return (
    <div className="container mx-auto py-8 space-y-6">
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
            <BreadcrumbLink href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices`}>
              <FileText className="h-4 w-4 mr-1" />
              Invoices
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/recurring`}>
              Recurring
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/recurring`}>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Recurring Invoice</h1>
          <p className="text-muted-foreground mt-1">
            Set up an automated invoice template for recurring billing
          </p>
        </div>
      </div>

      {/* Form */}
      {clients.length > 0 ? (
        <RecurringInvoiceForm clients={clients} userId={userId} />
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold mb-2">No Clients Found</h3>
          <p className="text-muted-foreground mb-6">
            You need to create a client before setting up recurring invoices.
          </p>
          <Link href="/dashboard/organisation?tab=clients">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              Create Client
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
