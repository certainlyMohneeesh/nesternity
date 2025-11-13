"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrencySymbol } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  MoreVertical,
  Eye,
  Send,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Proposal = {
  id: string;
  title: string;
  status: string;
  pricing: number;
  currency: string;
  createdAt: Date;
  sentAt: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  pdfUrl: string | null;
  client: {
    id: string;
    name: string;
    company: string | null;
  };
  project: {
    id: string;
    name: string;
  } | null;
  signatures: Array<{
    id: string;
    signerName: string;
    signedAt: Date;
  }>;
};

type Props = {
  proposals: Proposal[];
  orgId: string;
  projectId: string;
};

const statusColors = {
  DRAFT: "bg-gray-500",
  SENT: "bg-blue-500",
  ACCEPTED: "bg-green-500",
  REJECTED: "bg-red-500",
  CONVERTED_TO_INVOICE: "bg-purple-500",
};

const statusLabels = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CONVERTED_TO_INVOICE: "Invoiced",
};

export function ProposalsList({ proposals: initialProposals, orgId, projectId }: Props) {
  const router = useRouter();
  const [proposals, setProposals] = useState(initialProposals);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete proposal");
      }

      setProposals((prev) => prev.filter((p) => p.id !== id));
      toast.success("Proposal deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete proposal");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = async (id: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to send proposal");
      }

      const data = await response.json();
      
      // Update the proposal in the list
      setProposals((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: "SENT", sentAt: new Date() }
            : p
        )
      );

      toast.success("Proposal sent successfully");
      router.refresh();
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send proposal");
    }
  };

  // Filter proposals
  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.client.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search proposals, clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="CONVERTED_TO_INVOICE">Invoiced</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Proposals Grid */}
      {filteredProposals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "No proposals found matching your filters"
                : "No proposals yet. Create your first proposal!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProposals.map((proposal) => (
            <Card key={proposal.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {proposal.title}
                    </CardTitle>
                    <CardDescription>
                      {proposal.client.company || proposal.client.name}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/organisation/${orgId}/projects/${projectId}/proposals/${proposal.id}`}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {proposal.status === "DRAFT" && (
                        <DropdownMenuItem
                          onClick={() => handleSend(proposal.id)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Proposal
                        </DropdownMenuItem>
                      )}
                      {proposal.pdfUrl && (
                        <DropdownMenuItem asChild>
                          <a
                            href={proposal.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(proposal.id)}
                        disabled={deletingId === proposal.id}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingId === proposal.id ? "Deleting..." : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge
                    className={statusColors[proposal.status as keyof typeof statusColors]}
                  >
                    {statusLabels[proposal.status as keyof typeof statusLabels]}
                  </Badge>
                  <span className="text-lg font-semibold">
                    {getCurrencySymbol(proposal.currency)}
                    {proposal.pricing.toLocaleString()}
                  </span>
                </div>

                {proposal.project && (
                  <p className="text-sm text-muted-foreground">
                    Project: {proposal.project.name}
                  </p>
                )}

                {proposal.signatures.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Signed by {proposal.signatures[0].signerName}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Created {formatDistanceToNow(new Date(proposal.createdAt))}{" "}
                    ago
                  </span>
                  {proposal.sentAt && (
                    <span>
                      Sent {formatDistanceToNow(new Date(proposal.sentAt))} ago
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
