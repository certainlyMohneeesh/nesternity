import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { ProposalEditor } from '@/components/ai/ProposalEditor';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'AI Proposal Generator | Nesternity',
  description: 'Generate professional proposals with AI',
};

export default async function NewProposalPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: orgId, projectId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?returnUrl=/dashboard/organisation/${orgId}/projects/${projectId}/proposals/new`);
  }

  // Fetch organization details
  const organisation = await prisma.organisation.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!organisation) {
    redirect('/dashboard');
  }

  // Fetch user's clients scoped to this organisation
  const clients = await prisma.client.findMany({
    where: {
      createdBy: user.id,
      organisationId: orgId,  // Filter by current organisation
    },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // If no clients exist, create a default one for the organisation
  let effectiveClients = clients;
  if (clients.length === 0) {
    const defaultClient = await prisma.client.create({
      data: {
        name: organisation.name,
        email: organisation.email,
        company: organisation.name,
        createdBy: user.id,
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
    effectiveClients = [defaultClient];
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/organisation/${orgId}/projects/${projectId}/proposals`}>Proposals</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>New Proposal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Proposal Generator</h1>
        <p className="text-muted-foreground mt-2">
          Create professional proposals powered by AI in minutes
        </p>
      </div>

      {/* Always show ProposalEditor since we auto-create client if needed */}
      <ProposalEditor clients={effectiveClients} orgId={orgId} projectId={projectId} />
    </div>
  );
}
