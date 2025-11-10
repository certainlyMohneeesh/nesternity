/**
 * POST /api/ai/proposal/generate
 * Generate AI-powered proposal from client brief
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api';
import { generateStructuredCompletion, checkRateLimit } from '@/lib/ai/gemini';
import { createProposalPrompt } from '@/lib/ai/prompts';
import { withCache } from '@/lib/ai/cache';
import prisma from '@/lib/prisma';

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

    // 3. Parse and validate request
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

        return await generateStructuredCompletion<ProposalResponse>(messages, {
          temperature: 0.7,
          maxTokens: 4096,
        });
      },
      24 * 60 * 60 * 1000 // 24 hour cache
    );

    console.log('✅ Proposal generated successfully');
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
