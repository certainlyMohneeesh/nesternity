import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProposalEditForm } from "@/components/proposals/ProposalEditForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProposalPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?returnUrl=/dashboard/proposals/${id}/edit`);
  }

  // Fetch proposal with all details
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          phone: true,
          createdBy: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  // Check if proposal exists and belongs to user
  if (!proposal || proposal.client.createdBy !== user.id) {
    notFound();
  }

  // Only allow editing DRAFT proposals
  if (proposal.status !== "DRAFT") {
    redirect(`/dashboard/proposals/${id}`);
  }

  // Fetch all clients for the dropdown
  const clients = await prisma.client.findMany({
    where: {
      createdBy: user.id,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
    },
  });

  // Fetch all projects for the dropdown
  const projects = await prisma.project.findMany({
    where: {
      teamId: user.id,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      clientId: true,
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
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
            <BreadcrumbLink href="/dashboard/proposals">Proposals</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/proposals/${id}`}>
              {proposal.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Proposal Edit Form */}
      <ProposalEditForm 
        proposal={proposal} 
        clients={clients}
        projects={projects}
      />
    </div>
  );
}
