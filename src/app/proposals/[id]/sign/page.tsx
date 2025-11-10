import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SignatureComponent } from "@/components/proposals/SignatureComponent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PublicProposalSignPage({ params }: Props) {
  const { id } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          company: true,
        },
      },
      project: {
        select: {
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
  });

  if (!proposal) {
    notFound();
  }

  // Check if already signed
  const alreadySigned = proposal.status === "ACCEPTED" && proposal.signatures.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Proposal Review & Signature
          </h1>
          <p className="text-muted-foreground">
            Please review the proposal details below and sign to accept
          </p>
        </div>

        {/* Proposal Summary */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{proposal.title}</h2>
                  <p className="text-muted-foreground">
                    For {proposal.client.company || proposal.client.name}
                  </p>
                </div>
                <Badge
                  className={
                    alreadySigned
                      ? "bg-green-500"
                      : proposal.status === "SENT"
                      ? "bg-blue-500"
                      : ""
                  }
                >
                  {alreadySigned ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Accepted
                    </>
                  ) : (
                    proposal.status
                  )}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Total Value:</span>
                    <span className="text-lg font-bold">
                      {proposal.currency === "INR" ? "₹" : "$"}
                      {proposal.pricing.toLocaleString()}
                    </span>
                  </div>
                  {proposal.project && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Project:</span>
                      <span>{proposal.project.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Created:</span>
                    <span>{format(new Date(proposal.createdAt), "PPP")}</span>
                  </div>
                  {proposal.sentAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Sent:</span>
                      <span>{format(new Date(proposal.sentAt), "PPP")}</span>
                    </div>
                  )}
                </div>
              </div>

              {proposal.brief && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Project Brief</h3>
                  <p className="text-sm text-muted-foreground">{proposal.brief}</p>
                </div>
              )}

              {proposal.pdfUrl && (
                <div className="pt-4">
                  <a
                    href={proposal.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    <FileText className="h-4 w-4" />
                    View Full Proposal (PDF)
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Already Signed Message */}
        {alreadySigned ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">
                    This proposal has been accepted
                  </h3>
                  <p className="text-sm text-green-700">
                    Signed by {proposal.signatures[0].signerName} on{" "}
                    {format(new Date(proposal.signatures[0].signedAt), "PPP")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Signature Component */
          <SignatureComponent
            proposalId={proposal.id}
            onSignatureComplete={() => {
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
