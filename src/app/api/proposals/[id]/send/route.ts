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
          },
        },
      },
    });

    if (!proposal || proposal.client.createdBy !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // TODO: Generate PDF if not exists
    // TODO: Send email with PDF attachment

    // Update proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentTo: proposal.client.email,
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
