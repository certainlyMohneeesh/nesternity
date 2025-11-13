import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { sendProposalEmail } from "@/lib/email";
import { generateProposalAccessToken } from "@/lib/security";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { displayName: true, email: true }
    });

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
    let pdfUrl: string | null = proposal.pdfUrl;
    
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

      const generatedPdf = await generateProposalPDF(proposalForPDF);
      // Convert to string if it's a Buffer
      pdfUrl = typeof generatedPdf === 'string' ? generatedPdf : generatedPdf?.toString() || null;
      console.log('✅ PDF generated:', pdfUrl);
    }

    // Generate secure access token (valid for 30 days)
    const { token: accessToken, expiresAt: tokenExpiresAt } = generateProposalAccessToken(720);
    console.log('🔐 Generated secure access token for proposal:', id);

    // Set proposal expiration (30 days from now)
    const proposalExpiresAt = new Date();
    proposalExpiresAt.setDate(proposalExpiresAt.getDate() + 30);

    // Update proposal with token, PDF, and send status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentTo: proposal.client.email,
        pdfUrl: pdfUrl,
        accessToken,
        tokenExpiresAt,
        expiresAt: proposalExpiresAt,
      },
    });

    console.log('✅ Proposal updated with security token');

    // Send email with secure link
    const emailResult = await sendProposalEmail({
      recipientEmail: proposal.client.email,
      recipientName: proposal.client.name,
      recipientCompany: proposal.client.company || undefined,
      proposalTitle: proposal.title,
      proposalId: proposal.id,
      accessToken,
      pdfUrl: pdfUrl || undefined,
      pricing: proposal.pricing,
      currency: proposal.currency,
      senderName: dbUser?.displayName || dbUser?.email || user.email || 'Nesternity Team',
      expiresAt: proposalExpiresAt.toISOString(),
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send email:', emailResult.error);
      // Still return success since proposal was updated
      return NextResponse.json({
        success: true,
        proposal: updatedProposal,
        message: "Proposal updated but email failed to send",
        emailError: emailResult.error,
      }, { status: 200 });
    }

    console.log('✅ Proposal email sent successfully:', emailResult.emailId);

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
      message: "Proposal sent successfully",
      emailSent: true,
      emailId: emailResult.emailId,
    });
  } catch (error) {
    console.error("❌ Send proposal error:", error);
    return NextResponse.json(
      { error: "Failed to send proposal" },
      { status: 500 }
    );
  }
}
