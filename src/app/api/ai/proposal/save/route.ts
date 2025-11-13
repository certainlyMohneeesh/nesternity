/**
 * POST /api/ai/proposal/save
 * Save AI-generated proposal to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api';
import prisma from '@/lib/prisma';

interface SaveProposalRequest {
  clientId: string;
  projectId?: string;
  title: string;
  brief: string;
  deliverables: Array<{
    item: string;
    description: string;
    timeline: string;
  }>;
  timeline: {
    total: string;
    milestones: Array<{
      name: string;
      duration: string;
      deliverables: string[];
    }>;
  };
  pricing: {
    amount: number;
    currency: string;
    breakdown: Array<{
      item: string;
      cost: number;
    }>;
  };
  paymentTerms?: string;
  isChangeOrder?: boolean;
  parentProposalId?: string;
  changeReason?: string;
  aiPrompt?: string;
  aiModel?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await request.json() as SaveProposalRequest;
    const {
      clientId,
      projectId,
      title,
      brief,
      deliverables,
      timeline,
      pricing,
      paymentTerms,
      isChangeOrder = false,
      parentProposalId,
      changeReason,
      aiPrompt,
      aiModel,
    } = body;

    // 3. Validate required fields
    if (!clientId || !title || !brief || !deliverables || !timeline || !pricing) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 4. Verify client exists and user has access
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        createdBy: user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      );
    }

    // 5. If projectId provided, verify it exists
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    // 6. Create proposal in database
    // Get organisationId from project or client
    let organisationId = null;
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organisationId: true }
      });
      organisationId = project?.organisationId;
    } else if (client.organisationId) {
      organisationId = client.organisationId;
    }

    // @ts-ignore - Prisma model exists at runtime
    const proposal = await prisma.proposal.create({
      data: {
        clientId,
        projectId,
        organisationId,
        title,
        brief,
        deliverables,
        timeline,
        pricing: pricing.amount,
        currency: pricing.currency,
        paymentTerms,
        isChangeOrder,
        parentProposalId,
        changeReason,
        aiPrompt,
        aiModel,
        generatedByAI: true,
        createdBy: user.id,
        status: 'DRAFT',
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
            company: true,
          },
        },
        project: {
          select: {
            name: true,
            status: true,
          },
        },
      },
    });

    console.log('✅ Proposal saved:', proposal.id);

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        client: proposal.client,
        project: proposal.project,
        createdAt: proposal.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Proposal save error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save proposal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/proposal/save?clientId=xxx
 * List proposals for a client
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get query params
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');
    const organisationId = searchParams.get('organisationId');

    // 3. Build query
    const where: {
      createdBy: string;
      clientId?: string;
      projectId?: string;
      organisationId?: string;
    } = {
      createdBy: user.id,
    };

    if (organisationId) {
      where.organisationId = organisationId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    // 4. Fetch proposals
    // @ts-ignore - Prisma model exists at runtime
    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            email: true,
            company: true,
          },
        },
        project: {
          select: {
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      proposals: proposals.map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        pricing: p.pricing,
        currency: p.currency,
        client: p.client,
        project: p.project,
        isChangeOrder: p.isChangeOrder,
        generatedByAI: p.generatedByAI,
        signedAt: p.signedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error) {
    console.error('❌ Proposals fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch proposals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
