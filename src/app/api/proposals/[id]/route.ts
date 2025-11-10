import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

    // Delete proposal (signatures will cascade delete)
    await prisma.proposal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete proposal error:", error);
    return NextResponse.json(
      { error: "Failed to delete proposal" },
      { status: 500 }
    );
  }
}
