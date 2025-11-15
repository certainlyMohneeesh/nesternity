/**
 * POST /api/ai/scope-sentinel/scan
 * Scan project for scope creep and generate change order
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api';
import adapter from '@/lib/ai/adapter';
import { checkRateLimit } from '@/lib/ai/provider';
import { enforceFeatureLimit } from '@/lib/middleware/subscription'
import { incrementUsage } from '@/lib/usage'
import { FeatureType } from '@prisma/client'
import { createScopeAnalysisPrompt } from '@/lib/ai/prompts';
import { withCache } from '@/lib/ai/cache';
import { prisma } from '@/lib/db';

interface ScopeScanRequest {
  projectId: string;
  originalScope: string;
}

interface ScopeAnalysisResponse {
  creepRisk: number;
  riskLevel: 'low' | 'medium' | 'high';
  outOfScopeCount: number;
  flaggedItems: Array<{
    item: string;
    reason: string;
    category: 'feature_addition' | 'requirement_change' | 'technical_debt';
    impact: {
      hours: number;
      cost: number;
    };
  }>;
  patterns: string[];
  recommendations: string[];
  changeOrderDraft: string;
  estimatedImpact: {
    additionalHours: number;
    additionalCost: number;
    timelineDelay: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check rate limit
    const rateLimit = checkRateLimit(user.id, 20, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 3. Check feature limits for scope sentinel
    const check = await enforceFeatureLimit(user.id, FeatureType.SCOPE_RADAR_CHECK)
    if (!check.allowed) return NextResponse.json({ error: 'Feature quota exceeded', details: check }, { status: 403 })

    // 4. Parse request
    const body = await request.json() as ScopeScanRequest;
    const { projectId, originalScope } = body;

    if (!projectId || !originalScope) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, originalScope' },
        { status: 400 }
      );
    }

    // 4. Fetch project details with tasks
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        boards: {
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                tags: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 5. Analyze tasks (assume first 20 are original scope)
    const allTasks = project.boards.flatMap(b => b.tasks);
    const ORIGINAL_TASK_THRESHOLD = 20;
    
    const currentTasks = allTasks.map((task, index) => ({
      title: task.title,
      description: task.description,
      isOriginal: index < ORIGINAL_TASK_THRESHOLD,
    }));

    // Count revisions (tasks created after initial batch)
    const revisionCount = Math.max(0, allTasks.length - ORIGINAL_TASK_THRESHOLD);

    console.log('🔍 Scanning project for scope creep:', project.name);
    console.log(`📊 Total tasks: ${allTasks.length}, Revisions: ${revisionCount}`);

    // 6. Generate scope analysis with caching
    const cacheInput = {
      projectId,
      originalScope,
      taskCount: allTasks.length,
      revisionCount,
    };

    const result = await withCache<{
      data: ScopeAnalysisResponse;
      usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
      model: string;
    }>(
      'scope-sentinel',
      cacheInput,
      async () => {
        const messages = createScopeAnalysisPrompt({
          projectName: project.name,
          originalScope,
          currentTasks: currentTasks.slice(0, 50), // Limit to first 50 tasks
          revisionCount,
        });

        return await adapter.generateStructuredCompletion<ScopeAnalysisResponse>(messages, {
          temperature: 0.6,
          maxTokens: 4096,
          ragEnabled: process.env.AI_RAG_ENABLED === 'true',
        });
      },
      7 * 24 * 60 * 60 * 1000 // 7 day cache
    );

    // 7. Save scope radar entry to database
    // @ts-ignore - Prisma model exists at runtime
    const scopeRadar = await prisma.scopeRadar.create({
      data: {
        projectId,
        creepRisk: result.data.creepRisk,
        revisionCount,
        outOfScopeCount: result.data.outOfScopeCount,
        flaggedItems: result.data.flaggedItems,
        patterns: result.data.patterns,
        recommendations: result.data.recommendations,
        changeOrderDraft: result.data.changeOrderDraft,
        estimatedImpact: result.data.estimatedImpact,
        aiModel: result.model,
        acknowledged: false,
      },
    });

    console.log('✅ Scope analysis complete:', scopeRadar.id);

    // Increment usage for scope radar check
    try {
      const sub = await prisma.razorpaySubscription.findFirst({ where: { userId: user.id } })
      if (sub?.id) {
        await incrementUsage(user.id, sub.id, FeatureType.SCOPE_RADAR_CHECK, 1)
      } else {
        console.warn('Skipping usage increment: no subscription found for user:', user.id);
      }
    } catch (err) {
      console.warn('Failed to increment usage for scope radar check:', err)
    }
    console.log(`⚠️  Risk Level: ${result.data.riskLevel}, Creep Risk: ${result.data.creepRisk}`);

    return NextResponse.json({
      analysis: {
        id: scopeRadar.id,
        ...result.data,
        project: {
          name: project.name,
          client: project.client,
        },
      },
      metadata: {
        model: result.model,
        usage: result.usage,
      },
    });
  } catch (error) {
    console.error('❌ Scope analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze scope',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/scope-sentinel/scan?projectId=xxx
 * List scope radar entries
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    // @ts-ignore - Prisma model exists at runtime
    const scopeEntries = await prisma.scopeRadar.findMany({
      where: { projectId },
      orderBy: { flaggedAt: 'desc' },
      take: 10,
      include: {
        project: {
          select: {
            name: true,
            client: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ scopeEntries });
  } catch (error) {
    console.error('❌ Scope entries fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scope entries' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/scope-sentinel/scan/:id
 * Acknowledge scope creep alert
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // @ts-ignore - Prisma model exists at runtime
    const updated = await prisma.scopeRadar.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true,
      scopeRadar: updated,
    });
  } catch (error) {
    console.error('❌ Acknowledge error:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge' },
      { status: 500 }
    );
  }
}
