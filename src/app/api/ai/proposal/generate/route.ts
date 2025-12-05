/**
 * POST /api/ai/proposal/generate
 * Generate AI-powered proposal from client brief with history learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api';
import adapter from '@/lib/ai/adapter';
import { checkRateLimit } from '@/lib/ai/provider';
import { enforceFeatureLimit } from '@/lib/middleware/subscription'
import { incrementUsage } from '@/lib/usage'
import { FeatureType } from '@prisma/client'
import { createProposalPrompt, type HistoricalProposal, type OrganizationContext } from '@/lib/ai/prompts';
import { withCache } from '@/lib/ai/cache';
import { prisma } from '@/lib/db';

interface GenerateProposalRequest {
  clientId: string;
  brief: string;
  deliverables?: string[];
  budget?: number;
  timeline?: string;
  organisationId?: string;
  projectId?: string;
  enableReasoning?: boolean;
  enableHistoryLearning?: boolean;
}

interface ProposalResponse {
  title: string;
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
  paymentTerms: string;
  summary: string;
  executiveSummary?: string;
  scopeOfWork?: string;
  reasoning?: {
    pricingRationale: string;
    timelineRationale: string;
    risksIdentified: string[];
    assumptions: string[];
  };
}

/**
 * Fetch historical proposals for learning
 */
async function fetchHistoricalProposals(
  userId: string, 
  organisationId?: string, 
  limit = 10
): Promise<HistoricalProposal[]> {
  const proposals = await prisma.proposal.findMany({
    where: {
      createdBy: userId,
      ...(organisationId && { organisationId }),
      generatedByAI: true,
      status: { in: ['ACCEPTED', 'REJECTED', 'SENT'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      brief: true,
      deliverables: true,
      pricing: true,
      timeline: true,
      status: true,
      createdAt: true,
    },
  });

  return proposals.map(p => ({
    id: p.id,
    title: p.title || 'Untitled',
    brief: p.brief || '',
    deliverables: Array.isArray(p.deliverables) 
      ? (p.deliverables as Array<{ item: string }>).map(d => d.item || String(d))
      : [],
    pricing: {
      amount: (p.pricing as { amount?: number })?.amount || 0,
      currency: (p.pricing as { currency?: string })?.currency || 'INR',
    },
    timeline: (p.timeline as { total?: string })?.total || '',
    status: p.status === 'ACCEPTED' ? 'accepted' : p.status === 'REJECTED' ? 'rejected' : 'pending',
    createdAt: p.createdAt,
  })) as HistoricalProposal[];
}

/**
 * Fetch organization context
 */
async function fetchOrganizationContext(organisationId: string): Promise<OrganizationContext | undefined> {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: {
      name: true,
      // Add more fields as available in your schema
    },
  });

  if (!org) return undefined;

  return {
    name: org.name,
  };
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

    // 2. Check rate limit
    const rateLimit = checkRateLimit(user.id, 20, 60 * 60 * 1000); // 20 requests per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          resetAt: new Date(rateLimit.resetAt).toISOString() 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          }
        }
      );
    }

    // 3. Check feature limits for AI proposals
    const check = await enforceFeatureLimit(user.id, FeatureType.AI_PROPOSAL)
    if (!check.allowed) return NextResponse.json({ error: 'Feature quota exceeded', details: check }, { status: 403 })

    // 4. Parse and validate request
    const body = await request.json() as GenerateProposalRequest;
    const { 
      clientId, 
      brief, 
      deliverables, 
      budget, 
      timeline,
      organisationId,
      projectId,
      enableReasoning = true,
      enableHistoryLearning = true,
    } = body;

    if (!clientId || !brief) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, brief' },
        { status: 400 }
      );
    }

    // 5. Fetch client details
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        budget: true,
        currency: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    console.log('🔄 Generating AI proposal for client:', client.name);
    console.log('📚 History learning:', enableHistoryLearning ? 'enabled' : 'disabled');
    console.log('🧠 Deep reasoning:', enableReasoning ? 'enabled' : 'disabled');

    // 6. Fetch historical proposals for learning (if enabled)
    let historicalProposals: HistoricalProposal[] = [];
    let organizationContext: OrganizationContext | undefined;

    if (enableHistoryLearning) {
      console.log('📊 Fetching historical proposals for learning...');
      historicalProposals = await fetchHistoricalProposals(user.id, organisationId);
      console.log(`📊 Found ${historicalProposals.length} historical proposals`);
      
      if (organisationId) {
        organizationContext = await fetchOrganizationContext(organisationId);
      }
    }

    // 7. Generate proposal with caching
    const cacheInput = {
      clientId,
      brief,
      deliverables: deliverables || [],
      budget: budget || client.budget,
      timeline,
      enableReasoning,
      historyCount: historicalProposals.length,
    };

    const result = await withCache<{
      data: ProposalResponse;
      usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
      model: string;
    }>(
      'proposal',
      cacheInput,
      async () => {
        const messages = createProposalPrompt({
          clientName: client.name,
          clientEmail: client.email,
          company: client.company || undefined,
          brief,
          budget: budget || client.budget || undefined,
          timeline,
          deliverables,
          historicalProposals: enableHistoryLearning ? historicalProposals : undefined,
          organizationContext,
          enableReasoning,
        });

        return await adapter.generateStructuredCompletion<ProposalResponse>(messages, {
          temperature: 0.7,
          maxTokens: 6144, // Increased for reasoning output
          ragEnabled: process.env.AI_RAG_ENABLED === 'true',
        });
      },
      24 * 60 * 60 * 1000 // 24 hour cache
    );

    console.log('✅ Proposal generated successfully');
    // Increment usage for AI proposal
    try {
      const sub = await prisma.razorpaySubscription.findFirst({ where: { userId: user.id } })
      if (sub?.id) {
        await incrementUsage(user.id, sub.id, FeatureType.AI_PROPOSAL, 1)
      } else {
        console.warn('Skipping usage increment: no subscription found for user:', user.id);
      }
    } catch (err) {
      console.warn('Failed to increment usage for AI proposal:', err)
    }
    console.log('📊 Token usage:', result.usage);

    // 6. Return response with rate limit headers
    return NextResponse.json(
      {
        proposal: result.data,
        metadata: {
          model: result.model,
          usage: result.usage,
          cached: false, // TODO: Track this properly
        },
      },
      {
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    );
  } catch (error) {
    console.error('❌ Proposal generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate proposal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
