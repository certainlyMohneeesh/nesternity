import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { ProposalEditor } from '@/components/ai/ProposalEditor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UserPlus, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'AI Proposal Generator | Nesternity',
  description: 'Generate professional proposals with AI',
};

export default async function NewProposalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?returnUrl=/dashboard/proposals/new');
  }

  // Fetch user's clients
  const clients = await prisma.client.findMany({
    where: {
      createdBy: user.id,
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
            <BreadcrumbLink href="/dashboard/proposals">Proposals</BreadcrumbLink>
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

      {clients.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center bg-muted/30">
          <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No clients found</h3>
          <p className="mb-6 text-muted-foreground max-w-sm mx-auto">
            You need to create at least one client before generating proposals.
          </p>
          <Link href="/dashboard/clients">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </Link>
        </div>
      ) : (
        <ProposalEditor clients={clients} />
      )}
    </div>
  );
}
