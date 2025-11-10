"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Send,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  Mail,
  User,
  Building2,
  Phone,
  Edit,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

type Proposal = {
  id: string;
  title: string;
  status: string;
  brief: string;
  deliverables: any;
  timeline: any;
  pricing: number;
  currency: string;
  paymentTerms: string | null;
  pdfUrl: string | null;
  sentAt: Date | null;
  sentTo: string | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
  };
  project: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  signatures: Array<{
    id: string;
    signerName: string;
    signerEmail: string;
    signerTitle: string | null;
    signatureBlob: string;
    signatureType: string;
    signedAt: Date;
    ipAddress: string | null;
  }>;
};

type Props = {
  proposal: Proposal;
};

const statusColors = {
  DRAFT: "bg-gray-500",
  SENT: "bg-blue-500",
  ACCEPTED: "bg-green-500",
  REJECTED: "bg-red-500",
};

const statusLabels = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export function ProposalDetail({ proposal: initialProposal }: Props) {
  const router = useRouter();
  const [proposal, setProposal] = useState(initialProposal);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete proposal");
      }

      toast.success("Proposal deleted successfully");
      router.push("/dashboard/proposals");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete proposal");
      setIsDeleting(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to send proposal");
      }

      const data = await response.json();
      
      setProposal({
        ...proposal,
        status: "SENT",
        sentAt: new Date(),
        sentTo: proposal.client.email,
      });

      toast.success("Proposal sent successfully");
      setShowSendDialog(false);
      router.refresh();
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send proposal");
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to accept proposal");
      }

      setProposal({
        ...proposal,
        status: "ACCEPTED",
        acceptedAt: new Date(),
      });

      toast.success("Proposal marked as accepted");
      router.refresh();
    } catch (error) {
      console.error("Accept error:", error);
      toast.error("Failed to accept proposal");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reject proposal");
      }

      setProposal({
        ...proposal,
        status: "REJECTED",
        rejectedAt: new Date(),
      });

      toast.success("Proposal marked as rejected");
      router.refresh();
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject proposal");
    } finally {
      setIsRejecting(false);
    }
  };

  const deliverables = Array.isArray(proposal.deliverables)
    ? proposal.deliverables
    : [];
  const timeline = Array.isArray(proposal.timeline) ? proposal.timeline : [];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {proposal.title}
              </h1>
              <Badge
                className={
                  statusColors[proposal.status as keyof typeof statusColors]
                }
              >
                {statusLabels[proposal.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(proposal.createdAt))} ago
            </p>
          </div>

          <div className="flex gap-2">
            {proposal.status === "DRAFT" && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/dashboard/proposals/new?edit=${proposal.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </a>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowSendDialog(true)}
                  disabled={isSending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </>
            )}
            {proposal.status === "SENT" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAccept}
                  disabled={isAccepting}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isAccepting ? "Accepting..." : "Mark Accepted"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                  disabled={isRejecting}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {isRejecting ? "Rejecting..." : "Mark Rejected"}
                </Button>
              </>
            )}
            {proposal.status === "ACCEPTED" && (
              <Button size="sm" asChild>
                <a href={`/dashboard/contracts?from=proposal&id=${proposal.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View as Contract
                </a>
              </Button>
            )}
            {proposal.pdfUrl && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={proposal.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Client & Project Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{proposal.client.name}</span>
              </div>
              {proposal.client.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{proposal.client.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{proposal.client.email}</span>
              </div>
              {proposal.client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{proposal.client.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {proposal.currency === "INR" ? "₹" : "$"}
                  {proposal.pricing.toLocaleString()}
                </span>
              </div>
              {proposal.project && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Project: {proposal.project.name}</span>
                </div>
              )}
              {proposal.sentAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Sent on {format(new Date(proposal.sentAt), "PPP")}
                  </span>
                </div>
              )}
              {proposal.sentTo && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Sent to: {proposal.sentTo}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Brief */}
        <Card>
          <CardHeader>
            <CardTitle>Brief</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {proposal.brief}
            </p>
          </CardContent>
        </Card>

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Deliverables</CardTitle>
              <CardDescription>
                What we'll deliver for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deliverables.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.title || item.name}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Project milestones and schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((phase: any, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{phase.phase || phase.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {phase.duration || phase.timeline}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Terms */}
        {proposal.paymentTerms && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {proposal.paymentTerms}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Signatures */}
        {proposal.signatures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Signatures</CardTitle>
              <CardDescription>
                This proposal has been digitally signed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposal.signatures.map((signature) => (
                  <div
                    key={signature.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{signature.signerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {signature.signerEmail}
                        </p>
                        {signature.signerTitle && (
                          <p className="text-sm text-muted-foreground">
                            {signature.signerTitle}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">
                        Signed {formatDistanceToNow(new Date(signature.signedAt))}{" "}
                        ago
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-4">
                      <img
                        src={signature.signatureBlob}
                        alt="Signature"
                        className="h-16 border rounded"
                      />
                      <div className="text-xs text-muted-foreground">
                        <p>
                          Signed on: {format(new Date(signature.signedAt), "PPpp")}
                        </p>
                        {signature.ipAddress && (
                          <p>IP: {signature.ipAddress}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              proposal and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a PDF and send the proposal to{" "}
              <strong>{proposal.client.email}</strong>. The status will be
              updated to "Sent".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              {isSending ? "Sending..." : "Send Proposal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
