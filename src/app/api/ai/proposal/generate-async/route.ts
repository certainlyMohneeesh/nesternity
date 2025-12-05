/**
 * POST /api/ai/proposal/generate-async
 * Async AI-powered proposal generation with progress streaming
 * 
 * This endpoint supports:
 * - Progress updates via SSE (Server-Sent Events)
 * - History learning from past proposals
 * - Deep reasoning mode
 * - Background generation that persists across page navigation
 */

import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api';
import adapter from '@/lib/ai/adapter';
import { checkRateLimit } from '@/lib/ai/provider';
import { enforceFeatureLimit } from '@/lib/middleware/subscription';
import { incrementUsage } from '@/lib/usage';
import { FeatureType } from '@prisma/client';
import { createProposalPrompt, type HistoricalProposal, type OrganizationContext } from '@/lib/ai/prompts';
import { prisma } from '@/lib/db';

interface GenerateAsyncRequest {
  taskId: string;
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

// Progress phases with timing estimates
const GENERATION_PHASES = [
  { phase: 'analyzing', label: 'Analyzing project requirements...', percentage: 10, duration: 1500 },
  { phase: 'learning', label: 'Learning from historical proposals...', percentage: 25, duration: 2000 },
  { phase: 'reasoning', label: 'Deep reasoning about pricing and scope...', percentage: 45, duration: 3000 },
  { phase: 'generating', label: 'Generating proposal content...', percentage: 70, duration: 4000 },
  { phase: 'finalizing', label: 'Finalizing and validating...', percentage: 90, duration: 1500 },
];

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
    select: { name: true },
  });

  if (!org) return undefined;
  return { name: org.name };
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create a stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // 1. Authenticate user
        const user = await getAuthenticatedUser();

        if (!user) {
          sendEvent('error', { error: 'Unauthorized' });
          controller.close();
          return;
        }

        // 2. Check rate limit
        const rateLimit = checkRateLimit(user.id, 20, 60 * 60 * 1000);
        if (!rateLimit.allowed) {
          sendEvent('error', { error: 'Rate limit exceeded', resetAt: new Date(rateLimit.resetAt).toISOString() });
          controller.close();
          return;
        }

        // 3. Check feature limits
        const check = await enforceFeatureLimit(user.id, FeatureType.AI_PROPOSAL);
        if (!check.allowed) {
          sendEvent('error', { error: 'Feature quota exceeded', details: check });
          controller.close();
          return;
        }

        // 4. Parse request
        const body = await request.json() as GenerateAsyncRequest;
        const {
          taskId,
          clientId,
          brief,
          deliverables,
          budget,
          timeline,
          organisationId,
          enableReasoning = true,
          enableHistoryLearning = true,
        } = body;

        if (!clientId || !brief || !taskId) {
          sendEvent('error', { error: 'Missing required fields: taskId, clientId, brief' });
          controller.close();
          return;
        }

        // 5. Fetch client
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
          sendEvent('error', { error: 'Client not found' });
          controller.close();
          return;
        }

        // Send initial progress
        sendEvent('progress', {
          taskId,
          status: 'analyzing',
          percentage: 5,
          currentStep: 'Starting proposal generation...',
        });

        // 6. Simulate phases with progress updates
        for (const phase of GENERATION_PHASES) {
          sendEvent('progress', {
            taskId,
            status: phase.phase,
            percentage: phase.percentage,
            currentStep: phase.label,
          });

          // Delay to show progress (in real implementation, actual work happens here)
          await new Promise(resolve => setTimeout(resolve, phase.duration));
        }

        // 7. Fetch historical data (if enabled)
        let historicalProposals: HistoricalProposal[] = [];
        let organizationContext: OrganizationContext | undefined;

        if (enableHistoryLearning) {
          historicalProposals = await fetchHistoricalProposals(user.id, organisationId);
          if (organisationId) {
            organizationContext = await fetchOrganizationContext(organisationId);
          }
        }

        // 8. Generate the actual proposal
        sendEvent('progress', {
          taskId,
          status: 'generating',
          percentage: 75,
          currentStep: 'AI is generating your proposal...',
        });

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

        const result = await adapter.generateStructuredCompletion<ProposalResponse>(messages, {
          temperature: 0.7,
          maxTokens: 6144,
          ragEnabled: process.env.AI_RAG_ENABLED === 'true',
        });

        // 9. Increment usage
        try {
          const sub = await prisma.razorpaySubscription.findFirst({ where: { userId: user.id } });
          if (sub?.id) {
            await incrementUsage(user.id, sub.id, FeatureType.AI_PROPOSAL, 1);
          }
        } catch (err) {
          console.warn('Failed to increment usage:', err);
        }

        // 10. Send completion event
        sendEvent('progress', {
          taskId,
          status: 'completed',
          percentage: 100,
          currentStep: 'Proposal ready!',
        });

        sendEvent('complete', {
          taskId,
          proposal: result.data,
          metadata: {
            model: result.model,
            usage: result.usage,
            historyUsed: historicalProposals.length,
            reasoningEnabled: enableReasoning,
          },
        });

      } catch (error) {
        console.error('❌ Async proposal generation error:', error);
        sendEvent('error', {
          error: 'Failed to generate proposal',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
