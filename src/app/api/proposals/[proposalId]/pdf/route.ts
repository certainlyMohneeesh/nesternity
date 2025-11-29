import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/api";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ proposalId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { proposalId } = await context.params;
    const id = proposalId;

    // Fetch proposal with all details
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            createdBy: true,
            name: true,
            email: true,
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

    // Return existing PDF URL if available
    if (proposal.pdfUrl) {
      return NextResponse.json({
        success: true,
        pdfUrl: proposal.pdfUrl,
        cached: true,
      });
    }

    // Generate new PDF
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

    const pdfUrl = await generateProposalPDF(proposalForPDF);
    console.log('✅ PDF generated:', pdfUrl);

    // Update proposal with PDF URL
    await prisma.proposal.update({
      where: { id },
      data: {
        pdfUrl: typeof pdfUrl === 'string' ? pdfUrl : pdfUrl?.toString() || null
      },
    });

    return NextResponse.json({
      success: true,
      pdfUrl,
      cached: false,
    });
  } catch (error) {
    console.error("Generate PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
