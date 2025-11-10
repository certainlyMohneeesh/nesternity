/**
 * POST /api/ai/updates/generate
 * Generate AI-powered weekly update draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api';
import { generateStructuredCompletion, checkRateLimit } from '@/lib/ai/gemini';
import { createWeeklyUpdatePrompt } from '@/lib/ai/prompts';
import { withCache } from '@/lib/ai/cache';
import prisma from '@/lib/prisma';

interface GenerateUpdateRequest {
  clientId: string;
  projectId?: string;
  weekStart: string; // ISO date string
  weekEnd: string;   // ISO date string
}

interface UpdateResponse {
  summary: string;
  accomplishments: Array<{
    title: string;
    description: string;
    impact: string;
  }>;
  metrics: {
    tasksCompleted: number;
    tasksInProgress: number;
    percentComplete: number;
  };
  blockers: Array<{
    issue: string;
    impact: string;
    resolution: string;
  }>;
  nextSteps: Array<{
    item: string;
    eta: string;
  }>;
  emailDraft: string;
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

    // 3. Parse request
    const body = await request.json() as GenerateUpdateRequest;
    const { clientId, projectId, weekStart, weekEnd } = body;

    if (!clientId || !weekStart || !weekEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, weekStart, weekEnd' },
        { status: 400 }
      );
    }

    // 4. Fetch client and project details
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        name: true,
        email: true,
        projects: {
          where: projectId ? { id: projectId } : undefined,
          select: {
            id: true,
            name: true,
            boards: {
              select: {
                tasks: {
                  where: {
                    updatedAt: {
                      gte: new Date(weekStart),
                      lte: new Date(weekEnd),
                    },
                  },
                  select: {
                    title: true,
                    description: true,
                    status: true,
                    completedAt: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const project = client.projects[0];
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 5. Gather task data
    const allTasks = project.boards.flatMap(b => b.tasks);
    const tasksCompleted = allTasks.filter(t => 
      t.status === 'DONE' && 
      t.completedAt && 
      new Date(t.completedAt) >= new Date(weekStart) &&
      new Date(t.completedAt) <= new Date(weekEnd)
    );
    const tasksInProgress = allTasks.filter(t => t.status === 'IN_PROGRESS');

    console.log('🔄 Generating weekly update for:', client.name, project.name);

    // 6. Generate update with AI
    const cacheInput = {
      clientId,
      projectId: project.id,
      weekStart,
      weekEnd,
      tasksCompleted: tasksCompleted.length,
      tasksInProgress: tasksInProgress.length,
    };

    const result = await withCache<{
      data: UpdateResponse;
      usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
      model: string;
    }>(
      'weekly-update',
      cacheInput,
      async () => {
        const messages = createWeeklyUpdatePrompt({
          clientName: client.name,
          projectName: project.name,
          weekStart,
          weekEnd,
          tasksCompleted: tasksCompleted.map(t => ({
            title: t.title,
            description: t.description,
          })),
          tasksInProgress: tasksInProgress.map(t => ({
            title: t.title,
          })),
        });

        return await generateStructuredCompletion<UpdateResponse>(messages, {
          temperature: 0.7,
          maxTokens: 3072,
        });
      },
      7 * 24 * 60 * 60 * 1000 // 7 day cache
    );

    // 7. Save update draft to database
    // @ts-ignore - Prisma model exists at runtime
    const updateDraft = await prisma.updateDraft.create({
      data: {
        clientId,
        projectId: project.id,
        weekStart: new Date(weekStart),
        summary: result.data.summary,
        accomplishments: result.data.accomplishments,
        blockers: result.data.blockers || [],
        nextSteps: result.data.nextSteps,
        metrics: result.data.metrics,
        status: 'DRAFT',
        generatedByAI: true,
        aiModel: result.model,
        createdBy: user.id,
      },
    });

    console.log('✅ Weekly update generated:', updateDraft.id);

    return NextResponse.json({
      update: {
        id: updateDraft.id,
        ...result.data,
      },
      metadata: {
        model: result.model,
        usage: result.usage,
      },
    });
  } catch (error) {
    console.error('❌ Update generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/updates/generate?clientId=xxx
 * List update drafts
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
    const updates = await prisma.updateDraft.findMany({
      where,
      orderBy: { weekStart: 'desc' },
      take: 20,
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ updates });
  } catch (error) {
    console.error('❌ Updates fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}
