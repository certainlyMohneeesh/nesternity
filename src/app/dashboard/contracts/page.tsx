import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContractsList } from "@/components/contracts/ContractsList";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

export default async function ContractsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnUrl=/dashboard/contracts");
  }

  // Fetch all accepted proposals (contracts)
  const contracts = await prisma.proposal.findMany({
    where: {
      client: {
        createdBy: user.id,
      },
      status: "ACCEPTED",
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          company: true,
          email: true,
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
        orderBy: {
          signedAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      acceptedAt: "desc",
    },
  });

  // Calculate stats
  const stats = {
    total: contracts.length,
    totalValue: contracts.reduce((sum: number, c: any) => sum + c.pricing, 0),
    thisMonth: contracts.filter((c: any) => {
      const acceptedDate = new Date(c.acceptedAt);
      const now = new Date();
      return (
        acceptedDate.getMonth() === now.getMonth() &&
        acceptedDate.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">
            View and manage your accepted proposals
          </p>
        </div>
        <Link href="/dashboard/proposals">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View All Proposals
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total Contracts
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              This Month
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.thisMonth}</p>
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

      {/* Contracts List */}
      <ContractsList contracts={contracts} />
    </div>
  );
}
