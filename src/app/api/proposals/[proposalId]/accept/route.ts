import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { createProposalNotification, ACTIVITY_TYPES } from "@/lib/notifications";

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
      select: {
        id: true,
        title: true,
        pricing: true,
        currency: true,
        status: true,
        acceptedAt: true,
        client: {
          select: {
            id: true,
            name: true,
            createdBy: true,
          },
        },
      },
    });

    if (!proposal || proposal.client.createdBy !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update proposal status to ACCEPTED
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    // Get user's team for notification
    const userTeam = await prisma.team.findFirst({
      where: { createdBy: user.id },
      select: { id: true }
    });

    // Create notification for proposal accepted
    if (userTeam) {
      await createProposalNotification(
        user.id,
        ACTIVITY_TYPES.PROPOSAL_ACCEPTED,
        proposal.title,
        proposal.client.name,
        proposal.pricing,
        proposal.currency,
        {
          teamId: userTeam.id,
          proposalId: id,
          clientId: proposal.client.id
        }
      ).catch(err => console.error('Failed to create proposal accepted notification:', err));
    }

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
      message: "Proposal marked as accepted",
    });
  } catch (error) {
    console.error("Accept proposal error:", error);
    return NextResponse.json(
      { error: "Failed to accept proposal" },
      { status: 500 }
    );
  }
}
