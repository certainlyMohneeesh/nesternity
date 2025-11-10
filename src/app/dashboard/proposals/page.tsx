import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProposalsList } from "@/components/proposals/ProposalsList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function ProposalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnUrl=/dashboard/proposals");
  }

  // Fetch all proposals for this user's clients
  const proposals = await prisma.proposal.findMany({
    where: {
      client: {
        createdBy: user.id,
      },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      signatures: {
        select: {
          id: true,
          signerName: true,
          signedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate stats
  const stats = {
    total: proposals.length,
    draft: proposals.filter((p: any) => p.status === "DRAFT").length,
    sent: proposals.filter((p: any) => p.status === "SENT").length,
    accepted: proposals.filter((p: any) => p.status === "ACCEPTED").length,
    rejected: proposals.filter((p: any) => p.status === "REJECTED").length,
    totalValue: proposals
      .filter((p: any) => p.status === "ACCEPTED")
      .reduce((sum: number, p: any) => sum + p.pricing, 0),
    acceptanceRate:
      proposals.filter((p: any) => p.status !== "DRAFT").length > 0
        ? (
            (proposals.filter((p: any) => p.status === "ACCEPTED").length /
              proposals.filter((p: any) => p.status !== "DRAFT").length) *
            100
          ).toFixed(1)
        : "0.0",
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground">
            Manage and track all your client proposals
          </p>
        </div>
        <Link href="/dashboard/proposals/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total</p>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Acceptance Rate
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.acceptanceRate}%</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Accepted
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.accepted}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total Value
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold">
            ₹{stats.totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Proposals List Component */}
      <ProposalsList proposals={proposals} />
    </div>
  );
}
