/**
 * POST /api/ai/estimate-budget
 * Quick AI-powered budget estimation for proposals
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

    // 2. Parse request
    const body = await request.json() as BudgetEstimateRequest;
    const { title, brief, deliverables, timeline, currency = 'INR' } = body;

    if (!title || !brief || !deliverables || deliverables.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, brief, deliverables' },
        { status: 400 }
      );
    }

    console.log('💰 Budget estimation request for:', title);

    // 3. Fetch historical estimations for learning
    const historicalEstimations = await prisma.budgetEstimation.findMany({
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

    // 4. Create AI prompt
    const prompt = `You are an expert project cost estimator. Analyze the following project proposal and provide a detailed budget estimation.

**Project Title:** ${title}

**Project Brief:**
${brief}

**Deliverables:**
${deliverables.map((d, i) => `${i + 1}. ${d.item}
   Description: ${d.description}
   Timeline: ${d.timeline}`).join('\n')}

**Timeline/Milestones:**
${timeline.map((m, i) => `${i + 1}. ${m.name} (${m.duration})
   Deliverables: ${m.deliverables.join(', ')}`).join('\n')}

**Historical Data (for learning):**
${historicalEstimations.length > 0 ? historicalEstimations.map(h => 
  `- "${h.title}": Estimated ${h.estimatedBudget}, Actual ${h.actualBudget || 'N/A'}, Accuracy: ${h.accuracy || 'N/A'}%`
).join('\n') : 'No historical data available'}

**Instructions:**
1. Analyze the scope, complexity, and timeline
2. Consider industry standards for similar projects
3. Learn from historical estimations (if available) to improve accuracy
4. Provide a realistic budget estimate in ${currency}
5. Break down costs by major categories (design, development, testing, etc.)
6. Consider factors like: deliverable complexity, timeline constraints, revision rounds
7. Provide confidence level (low/medium/high) based on information completeness

Return ONLY a valid JSON object with this structure:
{
  "estimatedBudget": <number>,
  "confidence": "<low|medium|high>",
  "breakdown": [
    {
      "category": "<category name>",
      "amount": <number>,
      "reasoning": "<brief explanation>"
    }
  ],
  "rationale": "<overall reasoning for the estimate>"
}`;

    // 5. Generate estimation using AI
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent estimates
        topP: 0.8,
        topK: 20,
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    console.log('🤖 AI Response received');

    // Clean up response (remove markdown code blocks if present)
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let estimation: BudgetEstimation;
    try {
      estimation = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', text);
      throw new Error('Invalid AI response format');
    }

    // 6. Calculate timeline weeks for storage
    const timelineWeeks = timeline.reduce((total, milestone) => {
      const weeks = parseFloat(milestone.duration.match(/\d+/)?.[0] || '1');
      return total + weeks;
    }, 0);

    // 7. Store estimation for future learning
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

    console.log('✅ Budget estimation stored successfully');

    return NextResponse.json({
      success: true,
      estimation,
    });

  } catch (error) {
    console.error('❌ Budget estimation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate budget estimation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
