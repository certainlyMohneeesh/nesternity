import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📝 Starting proposal update...');
    const { id } = await context.params;
    console.log('📋 Proposal ID:', id);

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body = await request.json();
    console.log('📦 Update data received:', {
      clientId: body.clientId,
      projectId: body.projectId,
      title: body.title,
      deliverables: body.deliverables?.length,
      timeline: body.timeline?.length,
      pricing: body.pricing,
    });

    const {
      clientId,
      projectId,
      title,
      brief,
      deliverables,
      timeline,
      pricing,
      currency,
      paymentTerms,
    } = body;

    // Validate required fields
    if (!clientId || !title || !brief || !deliverables || !timeline || !pricing) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if proposal exists
    console.log('🔍 Fetching existing proposal...');
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            createdBy: true,
          },
        },
      },
    });

    if (!existingProposal) {
      console.error('❌ Proposal not found:', id);
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    console.log('✅ Proposal found:', existingProposal.title);
    console.log('📊 Current status:', existingProposal.status);

    // Check ownership
    if (existingProposal.client.createdBy !== user.id) {
      console.error('❌ Unauthorized: User does not own this proposal');
      return NextResponse.json(
        { error: "You don't have permission to edit this proposal" },
        { status: 403 }
      );
    }

    // Only allow editing DRAFT proposals
    if (existingProposal.status !== "DRAFT") {
      console.error('❌ Cannot edit non-draft proposal. Status:', existingProposal.status);
      return NextResponse.json(
        { error: "Only draft proposals can be edited" },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed');

    // Update the proposal
    console.log('💾 Updating proposal in database...');
    
    // Get organisationId from project or client
    let organisationId = null;
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organisationId: true }
      });
      organisationId = project?.organisationId;
    } else {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { organisationId: true }
      });
      organisationId = client?.organisationId;
    }
    
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        clientId,
        projectId: projectId || null,
        organisationId,
        title,
        brief,
        deliverables,
        timeline,
        pricing,
        currency,
        paymentTerms: paymentTerms || null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    console.log('✅ Proposal updated successfully!');
    console.log('  🆔 ID:', updatedProposal.id);
    console.log('  📝 Title:', updatedProposal.title);
    console.log('  💰 Pricing:', updatedProposal.currency, updatedProposal.pricing);
    console.log('  📦 Deliverables:', Array.isArray(updatedProposal.deliverables) ? updatedProposal.deliverables.length : 0);

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
      message: "Proposal updated successfully",
    });
  } catch (error) {
    console.error("❌ Update proposal error:", error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 }
    );
  }
}

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
