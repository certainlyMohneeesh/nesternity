"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  MoreVertical,
  Eye,
  Download,
  FileText,
  Search,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type Contract = {
  id: string;
  title: string;
  pricing: number;
  currency: string;
  acceptedAt: Date | null;
  pdfUrl: string | null;
  client: {
    id: string;
    name: string;
    company: string | null;
    email: string;
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
  contracts: Contract[];
};

export function ContractsList({ contracts: initialContracts }: Props) {
  const [contracts] = useState(initialContracts);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter contracts
  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client.company?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contracts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Contracts Grid */}
      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? "No contracts found matching your search"
                : "No contracts yet. Accepted proposals will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {contract.title}
                    </CardTitle>
                    <CardDescription>
                      {contract.client.company || contract.client.name}
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
                          href={`/dashboard/proposals/${contract.id}`}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {contract.pdfUrl && (
                        <DropdownMenuItem asChild>
                          <a
                            href={contract.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/invoices?from=contract&id=${contract.id}`}
                          className="cursor-pointer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Convert to Invoice
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-500">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Accepted
                  </Badge>
                  <span className="text-lg font-semibold">
                    {contract.currency === "INR" ? "₹" : "$"}
                    {contract.pricing.toLocaleString()}
                  </span>
                </div>

                {contract.project && (
                  <p className="text-sm text-muted-foreground">
                    Project: {contract.project.name}
                  </p>
                )}

                {contract.signatures.length > 0 && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      Signed by {contract.signatures[0].signerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(contract.signatures[0].signedAt))}{" "}
                      ago
                    </p>
                  </div>
                )}

                {contract.acceptedAt && (
                  <div className="text-xs text-muted-foreground">
                    Accepted{" "}
                    {formatDistanceToNow(new Date(contract.acceptedAt))} ago
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
