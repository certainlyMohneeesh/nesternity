/**
 * POST /api/ai/proposal/generate
 * Generate AI-powered proposal from client brief
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api';
import adapter from '@/lib/ai/adapter';
import { checkRateLimit } from '@/lib/ai/provider';
import { enforceFeatureLimit } from '@/lib/middleware/subscription'
import { incrementUsage } from '@/lib/usage'
import { FeatureType } from '@prisma/client'
import { createProposalPrompt } from '@/lib/ai/prompts';
import { withCache } from '@/lib/ai/cache';
import { prisma } from '@/lib/db';

interface GenerateProposalRequest {
  clientId: string;
  brief: string;
  deliverables?: string[];
  budget?: number;
  timeline?: string;
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
    const { clientId, brief, deliverables, budget, timeline } = body;

    if (!clientId || !brief) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, brief' },
        { status: 400 }
      );
    }

    // 4. Fetch client details
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

    // 5. Generate proposal with caching
    const cacheInput = {
      clientId,
      brief,
      deliverables: deliverables || [],
      budget: budget || client.budget,
      timeline,
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
        });

        return await adapter.generateStructuredCompletion<ProposalResponse>(messages, {
          temperature: 0.7,
          maxTokens: 4096,
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
