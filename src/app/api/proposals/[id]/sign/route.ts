import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { signerName, signerEmail, signerTitle, signatureBlob, signatureType } = body;

    // Validate required fields
    if (!signerName || !signerEmail || !signatureBlob) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Get client IP and user agent
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create signature record
    const signature = await prisma.signature.create({
      data: {
        proposalId: id,
        signerName,
        signerEmail,
        signerTitle,
        signatureBlob,
        signatureType,
        ipAddress: ip,
        userAgent,
      },
    });

    // Update proposal status to ACCEPTED and set acceptedAt
    await prisma.proposal.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        signedAt: new Date(),
        signedByName: signerName,
        eSignatureUrl: signatureBlob,
      },
    });

    return NextResponse.json({
      success: true,
      signature,
      message: "Proposal signed successfully",
    });
  } catch (error) {
    console.error("Sign proposal error:", error);
    return NextResponse.json(
      { error: "Failed to sign proposal" },
      { status: 500 }
    );
  }
}
