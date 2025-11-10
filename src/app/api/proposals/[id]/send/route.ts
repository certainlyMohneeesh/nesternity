import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if proposal exists and belongs to user
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            createdBy: true,
            email: true,
            name: true,
            company: true,
            phone: true,
            address: true,
          },
        },
        project: {
          select: {
            name: true,
            description: true,
          },
        },
        signatures: true,
      },
    });

    if (!proposal || proposal.client.createdBy !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Generate PDF if not already generated
    let pdfUrl = proposal.pdfUrl;
    
    if (!pdfUrl) {
      console.log('📄 Generating PDF for proposal:', proposal.title);
      
      const { generateProposalPDF } = await import('@/lib/generateProposalPdf');
      
      const proposalForPDF = {
        id: proposal.id,
        title: proposal.title,
        createdAt: proposal.createdAt,
        pricing: proposal.pricing,
        currency: proposal.currency,
        paymentTerms: proposal.paymentTerms,
        brief: proposal.brief,
        deliverables: proposal.deliverables,
        timeline: proposal.timeline,
        client: {
          name: proposal.client.name,
          email: proposal.client.email,
          company: proposal.client.company,
          phone: proposal.client.phone,
          address: proposal.client.address,
        },
        project: proposal.project,
        signatures: proposal.signatures,
      };

      pdfUrl = await generateProposalPDF(proposalForPDF);
      console.log('✅ PDF generated:', pdfUrl);
    }

    // TODO: Send email with PDF attachment
    // For now, we'll just update the status

    // Update proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentTo: proposal.client.email,
        pdfUrl: pdfUrl,
      },
    });

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
      message: "Proposal sent successfully",
    });
  } catch (error) {
    console.error("Send proposal error:", error);
    return NextResponse.json(
      { error: "Failed to send proposal" },
      { status: 500 }
    );
  }
}
