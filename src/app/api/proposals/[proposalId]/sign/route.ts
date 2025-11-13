import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIP, isTokenValid } from "@/lib/security";
import { revalidatePath } from "next/cache";
import { createProposalNotification, ACTIVITY_TYPES } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Rate Limiting: 3 signature attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(`signature:${clientIP}`, 3, 15 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { 
          error: "Too many signature attempts",
          message: `Please wait ${resetIn} minutes before trying again`,
          resetIn 
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { signerName, signerEmail, signerTitle, signatureBlob, signatureType, token } = body;

    // Validate required fields
    if (!signerName || !signerEmail || !signatureBlob) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signerEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        pricing: true,
        currency: true,
        status: true,
        accessToken: true,
        tokenExpiresAt: true,
        expiresAt: true,
        createdBy: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true,
            createdBy: true,
          }
        }
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Security Check 1: Validate access token
    if (!token || token !== proposal.accessToken) {
      return NextResponse.json(
        { error: "Invalid or missing access token" },
        { status: 403 }
      );
    }

    // Security Check 2: Validate token expiration
    if (!isTokenValid(proposal.tokenExpiresAt)) {
      return NextResponse.json(
        { error: "Access token has expired" },
        { status: 403 }
      );
    }

    // Security Check 3: Validate proposal expiration
    if (proposal.expiresAt && new Date() > new Date(proposal.expiresAt)) {
      return NextResponse.json(
        { error: "Proposal has expired" },
        { status: 410 }
      );
    }

    // Check if already signed
    if (proposal.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "Proposal has already been signed" },
        { status: 409 }
      );
    }

    // Get client IP and user agent for audit trail
    const userAgent = request.headers.get("user-agent") || "unknown";

    console.log('✍️ Creating signature for proposal:', id);
    console.log('📧 Signer:', signerEmail);
    console.log('🌐 IP:', clientIP);

    // Create signature record
    const signature = await prisma.signature.create({
      data: {
        proposalId: id,
        signerName,
        signerEmail,
        signerTitle,
        signatureBlob,
        signatureType,
        ipAddress: clientIP,
        userAgent,
      },
    });

    console.log('✅ Signature created:', signature.id);

    // Update proposal status to ACCEPTED and invalidate the token
    await prisma.proposal.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        signedAt: new Date(),
        signedByName: signerName,
        eSignatureUrl: signatureBlob,
        // Invalidate token after successful signature
        tokenExpiresAt: new Date(), // Set to now to expire immediately
      },
    });

    console.log('✅ Proposal marked as ACCEPTED');

    // Get user's team for notification
    const userTeam = await prisma.team.findFirst({
      where: { createdBy: proposal.client.createdBy },
      select: { id: true }
    });

    // Create notification for proposal signed
    if (userTeam) {
      await createProposalNotification(
        proposal.createdBy,
        ACTIVITY_TYPES.PROPOSAL_SIGNED,
        proposal.title,
        proposal.client.name,
        proposal.pricing,
        proposal.currency,
        {
          teamId: userTeam.id,
          proposalId: id,
          clientId: proposal.clientId,
          signerName,
          signerEmail
        }
      ).catch(err => console.error('Failed to create proposal signed notification:', err));
    }

    // Revalidate relevant pages to show updated status
    revalidatePath('/dashboard/proposals');
    revalidatePath('/dashboard/contracts');
    revalidatePath(`/dashboard/proposals/${id}`);

    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        signerName: signature.signerName,
        signedAt: signature.signedAt,
      },
      message: "Proposal signed successfully! 🎉",
    });
  } catch (error) {
    console.error("❌ Sign proposal error:", error);
    return NextResponse.json(
      { error: "Failed to sign proposal" },
      { status: 500 }
    );
  }
}
