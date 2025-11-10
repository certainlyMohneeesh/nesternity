import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SignatureComponent } from "@/components/proposals/SignatureComponent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, FileText, AlertTriangle, Shield } from "lucide-react";
import { format } from "date-fns";
import { isTokenValid } from "@/lib/security";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function PublicProposalSignPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;

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

  // Security Check 1: Validate access token
  if (!token || token !== proposal.accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-16 w-16 text-red-600" />
                <div>
                  <h1 className="text-2xl font-bold text-red-900 mb-2">
                    Invalid or Missing Access Token
                  </h1>
                  <p className="text-red-700 mb-4">
                    This proposal requires a secure access token to view. Please use the link provided in your email.
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-gray-600">
                      <strong>Security Notice:</strong> If you received this link via email, please make sure you're using the complete URL including the token parameter.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Security Check 2: Validate token expiration
  if (!isTokenValid(proposal.tokenExpiresAt)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-16 w-16 text-amber-600" />
                <div>
                  <h1 className="text-2xl font-bold text-amber-900 mb-2">
                    Access Link Expired
                  </h1>
                  <p className="text-amber-700 mb-4">
                    This proposal access link has expired for security reasons.
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-amber-200">
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>What to do next:</strong>
                    </p>
                    <ul className="text-left text-sm text-gray-600 space-y-2">
                      <li>• Contact the sender to request a new link</li>
                      <li>• They can resend the proposal from their dashboard</li>
                      <li>• New links are valid for 30 days</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Security Check 3: Validate proposal expiration
  if (proposal.expiresAt && new Date() > new Date(proposal.expiresAt)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <Calendar className="h-16 w-16 text-gray-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Proposal Expired
                  </h1>
                  <p className="text-gray-700 mb-4">
                    This proposal expired on {format(new Date(proposal.expiresAt), "PPP")}.
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      Please contact the sender to discuss a revised proposal or extension.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Track view (increment view count and update last viewed)
  await prisma.proposal.update({
    where: { id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  });

  // Check if already signed
  const alreadySigned = proposal.status === "ACCEPTED" && proposal.signatures.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Security Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
            <Shield className="mr-1 h-3 w-3" />
            Secure & Encrypted Connection
          </Badge>
        </div>

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
                  {proposal.expiresAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">Valid Until:</span>
                      <span className="text-amber-600 font-semibold">
                        {format(new Date(proposal.expiresAt), "PPP")}
                      </span>
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
          <SignatureComponent proposalId={proposal.id} />
        )}

        {/* Security Footer */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Shield className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-slate-700">Security & Privacy</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your signature is legally binding and securely stored</li>
                  <li>• All data is encrypted in transit and at rest</li>
                  <li>• IP address and timestamp are recorded for audit purposes</li>
                  <li>• This link is unique and will expire after use or on {proposal.tokenExpiresAt ? format(new Date(proposal.tokenExpiresAt), "PP") : 'expiration'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
