/**
 * POST /api/ai/estimate
 * Generate AI-powered project estimation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api';
import adapter from '@/lib/ai/adapter';
import { checkRateLimit } from '@/lib/ai/provider';
import { enforceFeatureLimit } from '@/lib/middleware/subscription'
import { incrementUsage } from '@/lib/usage'
import { FeatureType } from '@prisma/client'
import { createEstimationPrompt } from '@/lib/ai/prompts';
import { withCache } from '@/lib/ai/cache';
import { prisma } from '@/lib/db';

interface EstimateRequest {
  clientId?: string;
  projectId?: string;
  title: string;
  description: string;
  deliverables: string[];
  includeHistoricalData?: boolean;
}

interface EstimationResponse {
  estimatedHours: number;
  estimatedCost: number;
  confidence: number;
  breakdown: Array<{
    phase: string;
    hours: number;
    cost: number;
  }>;
  rationale: string;
  riskFactors: Array<{
    risk: string;
    impact: string;
    mitigation: string;
  }>;
  assumptions: string[];
  suggestedPackages: Array<{
    name: string;
    hours: number;
    cost: number;
    features: string[];
  }>;
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
    const rateLimit = checkRateLimit(user.id, 20, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          resetAt: new Date(rateLimit.resetAt).toISOString() 
        },
        { status: 429 }
      );
    }

    // 3. Check feature limits for AI estimation
    const check = await enforceFeatureLimit(user.id, FeatureType.AI_CONTRACT)
    if (!check.allowed) return NextResponse.json({ error: 'Feature quota exceeded', details: check }, { status: 403 })

    // 4. Parse request
    const body = await request.json() as EstimateRequest;
    const { 
      clientId, 
      projectId, 
      title, 
      description, 
      deliverables, 
      includeHistoricalData = true 
    } = body;

    if (!title || !description || !deliverables || deliverables.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, deliverables' },
        { status: 400 }
      );
    }

    // 4. Fetch historical data if requested
    let historicalData: {
      similarProjects: Array<{
        name: string;
        hours: number;
        cost: number;
        actualVsEstimate?: number;
      }>;
    } | undefined;
    
    if (includeHistoricalData) {
      // Get user's past estimations for similar projects
      // @ts-ignore - Prisma model exists at runtime
      const pastEstimations = await prisma.estimation.findMany({
        where: {
          createdBy: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          title: true,
          estimatedHours: true,
          estimatedCost: true,
          historicalAccuracy: true,
        },
      });

      if (pastEstimations.length > 0) {
        historicalData = {
          similarProjects: pastEstimations.map((p: any) => ({
            name: p.title,
            hours: p.estimatedHours,
            cost: p.estimatedCost,
            actualVsEstimate: p.historicalAccuracy || 0,
          })),
        };
      }
    }

    // 5. Get client budget if clientId provided
    let clientBudget: number | undefined;
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { budget: true },
      });
      clientBudget = client?.budget || undefined;
    }

    console.log('🔄 Generating AI estimation:', title);

    // 6. Generate estimation with caching
    const cacheInput = {
      description,
      deliverables,
      clientBudget,
      historicalData: historicalData ? JSON.stringify(historicalData) : undefined,
    };

    const result = await withCache<{
      data: EstimationResponse;
      usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
      model: string;
    }>(
      'estimation',
      cacheInput,
      async () => {
        const messages = createEstimationPrompt({
          projectDescription: description,
          deliverables,
          clientBudget,
          historicalData,
        });

        return await adapter.generateStructuredCompletion<EstimationResponse>(messages, {
          temperature: 0.5, // Lower temperature for more consistent estimates
          maxTokens: 8192, // Increased for longer responses
        });
      },
      24 * 60 * 60 * 1000 // 24 hour cache
    );

    // 7. Save estimation to database
    // @ts-ignore - Prisma model exists at runtime
    const estimation = await prisma.estimation.create({
      data: {
        clientId,
        projectId,
        title,
        description,
        estimatedHours: result.data.estimatedHours,
        estimatedCost: result.data.estimatedCost,
        confidence: result.data.confidence,
        currency: 'INR',
        rationale: result.data.rationale,
        suggestedPackages: result.data.suggestedPackages,
        riskFactors: result.data.riskFactors,
        assumptions: result.data.assumptions,
        similarProjectsCount: historicalData?.similarProjects.length || 0,
        aiModel: result.model,
        createdBy: user.id,
      },
    });

    console.log('✅ Estimation generated and saved:', estimation.id);

    // Increment usage for AI estimation
    try {
      // Use the razorpaySubscription for this user if available
        const sub = await prisma.razorpaySubscription.findFirst({ where: { userId: user.id } })
        if (sub?.id) {
          await incrementUsage(user.id, sub.id, FeatureType.AI_CONTRACT, 1)
        } else {
          console.warn('Skipping usage increment: no subscription found for user:', user.id);
        }
    } catch (err) {
      console.warn('Failed to increment usage for AI estimation:', err)
    }

    return NextResponse.json({
      estimation: {
        id: estimation.id,
        ...result.data,
      },
      metadata: {
        model: result.model,
        usage: result.usage,
      },
    });
  } catch (error) {
    console.error('❌ Estimation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate estimation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/estimate?clientId=xxx or ?projectId=xxx
 * List estimations
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');

    const where: {
      createdBy: string;
      clientId?: string;
      projectId?: string;
    } = {
      createdBy: user.id,
    };

    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;

    // @ts-ignore - Prisma model exists at runtime
    const estimations = await prisma.estimation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ estimations });
  } catch (error) {
    console.error('❌ Estimations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimations' },
      { status: 500 }
    );
  }
}
