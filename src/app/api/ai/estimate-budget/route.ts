/**
 * POST /api/ai/estimate-budget
 * Quick AI-powered budget estimation for proposals
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import adapter from '@/lib/ai/adapter';
import { createEstimationPrompt } from '@/lib/ai/prompts';
import { prisma } from '@/lib/db';
import { enforceFeatureLimit } from '@/lib/middleware/subscription'
import { incrementUsage } from '@/lib/usage'
import { FeatureType } from '@prisma/client'


interface BudgetEstimateRequest {
  title: string;
  brief: string;
  deliverables: Array<{
    item: string;
    description: string;
    timeline: string;
  }>;
  timeline: Array<{
    name: string;
    duration: string;
    deliverables: string[];
  }>;
  currency?: string;
}

interface BudgetEstimation {
  estimatedBudget: number;
  confidence: 'low' | 'medium' | 'high';
  breakdown: Array<{
    category: string;
    amount: number;
    reasoning: string;
  }>;
  rationale: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check feature limits
    const check = await enforceFeatureLimit(user.id, FeatureType.AI_CONTRACT)
    if (!check.allowed) return NextResponse.json({ error: 'Feature quota exceeded', details: check }, { status: 403 })

    // 3. Parse request
    const body = await request.json() as BudgetEstimateRequest;
    const { title, brief, deliverables, timeline, currency = 'INR' } = body;

    if (!title || !brief || !deliverables || deliverables.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, brief, deliverables' },
        { status: 400 }
      );
    }

    console.log('💰 Budget estimation request for:', title);
    console.log('📦 Deliverables count:', deliverables.length);
    console.log('⏱️  Timeline milestones:', timeline?.length || 0);

    // 3. Fetch historical estimations for learning
    let historicalEstimations: Array<{
      title: string;
      estimatedBudget: number;
      actualBudget: number | null;
      deliverableCount: number;
      timelineWeeks: number;
      accuracy: number | null;
    }> = [];
    try {
      historicalEstimations = await prisma.budgetEstimation.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        select: {
          title: true,
          estimatedBudget: true,
          actualBudget: true,
          deliverableCount: true,
          timelineWeeks: true,
          accuracy: true,
        },
      });
      console.log(`📊 Found ${historicalEstimations.length} historical estimations for learning`);
    } catch (dbError) {
      console.warn('⚠️  Could not fetch historical data:', dbError instanceof Error ? dbError.message : 'Unknown error');
      // Continue without historical data
    }

    // 4. Build prompt messages via prompts helper with currency awareness
    const messages = createEstimationPrompt({
      projectDescription: brief,
      deliverables: deliverables.map(d => d.item),
      clientBudget: currency === 'INR' ? undefined : undefined, // keep currency handling simple
      historicalData: { similarProjects: historicalEstimations.map(h => ({ name: h.title, hours: h.estimatedBudget, cost: h.estimatedBudget, actualVsEstimate: h.accuracy ?? undefined })) }
    }, currency); // Pass currency for market-aware rates


    // 5. Generate estimation using the adapter (RAG + provider). This returns structured JSON as data.
    const result = await adapter.generateStructuredCompletion<{
      estimatedBudget: number;
      confidence: string;
      breakdown: Array<{ category: string; amount: number; reasoning: string }>;
      rationale: string;
    }>(messages, { temperature: 0.3, maxTokens: 4096, ragEnabled: process.env.AI_RAG_ENABLED === 'true' });

    const estimation = {
      estimatedBudget: result.data.estimatedBudget,
      confidence: (result.data.confidence?.toLowerCase() === 'high' || result.data.confidence?.toLowerCase() === 'medium' || result.data.confidence?.toLowerCase() === 'low')
        ? result.data.confidence.toLowerCase()
        : 'medium',
      breakdown: result.data.breakdown || [],
      rationale: result.data.rationale || '',
    } as BudgetEstimation;
    console.log('✅ Successfully generated AI estimation');
    console.log('💵 Estimated budget:', estimation.estimatedBudget);
    console.log('🎯 Confidence level:', estimation.confidence);

    // 6. Calculate timeline weeks for storage
    const timelineWeeks = timeline.reduce((total, milestone) => {
      const weeks = parseFloat(milestone.duration.match(/\d+/)?.[0] || '1');
      return total + weeks;
    }, 0);

    // 7. Store estimation for future learning
    try {
      await prisma.budgetEstimation.create({
        data: {
          userId: user.id,
          title,
          brief,
          deliverables: deliverables as any,
          timeline: timeline as any,
          estimatedBudget: estimation.estimatedBudget,
          confidence: estimation.confidence,
          breakdown: estimation.breakdown as any,
          rationale: estimation.rationale,
          currency,
          deliverableCount: deliverables.length,
          timelineWeeks,
        },
      });
      console.log('💾 Budget estimation stored successfully');
    } catch (dbError) {
      console.warn('⚠️  Could not store estimation:', dbError instanceof Error ? dbError.message : 'Unknown error');
      // Continue even if storage fails
    }

    console.log('✅ Budget estimation completed successfully');

    // Increment usage for AI estimates
    try {
      const sub = await prisma.razorpaySubscription.findFirst({ where: { userId: user.id } })
      if (sub?.id) {
        await incrementUsage(user.id, sub.id, FeatureType.AI_CONTRACT, 1)
      } else {
        console.warn('Skipping usage increment: no subscription found for user:', user.id);
      }
    } catch (err) {
      console.warn('Failed to increment usage for AI estimate:', err)
    }

    return NextResponse.json({
      success: true,
      estimation,
    });

  } catch (error) {
    console.error('❌ Budget estimation error:', error);

    // Enhanced error logging
    if (error instanceof Error) {
      console.error('📛 Error name:', error.name);
      console.error('📝 Error message:', error.message);
      console.error('📚 Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to generate budget estimation',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
