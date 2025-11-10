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
