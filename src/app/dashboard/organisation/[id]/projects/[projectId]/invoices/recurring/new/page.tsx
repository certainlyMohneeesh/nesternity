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

  // Fetch organisation details
  const organisation = await prisma.organisation.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!organisation) {
    redirect("/dashboard");
  }

  // Fetch user's clients filtered by organisationId
  let clients = await prisma.client.findMany({
    where: {
      createdBy: userId,
      organisationId: orgId,
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

  console.log('[NewRecurringInvoicePage] Found clients for organisation:', clients.length);

  // Auto-create default client if none exist
  if (clients.length === 0) {
    console.log('[NewRecurringInvoicePage] No clients found, creating default client for organisation');
    const defaultClient = await prisma.client.create({
      data: {
        name: organisation.name,
        email: organisation.email,
        company: organisation.name,
        createdBy: userId,
        organisationId: orgId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
      },
    });
    clients = [defaultClient];
  }

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
      <RecurringInvoiceForm clients={clients} userId={userId} />
    </div>
  );
}
