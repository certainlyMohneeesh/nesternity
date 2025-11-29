/**
 * AI Prompt Templates
 * Structured prompts for each AI feature
 */

import { ChatMessage } from './types';

export interface ProposalPromptInput {
  clientName: string;
  clientEmail: string;
  company?: string;
  brief: string;
  budget?: number;
  timeline?: string;
  deliverables?: string[];
}

export interface EstimationPromptInput {
  projectDescription: string;
  deliverables: string[];
  clientBudget?: number;
  historicalData?: {
    similarProjects: Array<{
      name: string;
      hours: number;
      cost: number;
      actualVsEstimate?: number;
    }>;
  };
}

export interface UpdatePromptInput {
  clientName: string;
  projectName: string;
  weekStart: string;
  weekEnd: string;
  commits?: Array<{ message: string; date: string }>;
  tasksCompleted?: Array<{ title: string; description?: string }>;
  tasksInProgress?: Array<{ title: string; blockers?: string }>;
  milestones?: Array<{ name: string; status: string }>;
}

export interface ScopePromptInput {
  projectName: string;
  originalScope: string;
  currentTasks: Array<{ title: string; description: string; isOriginal: boolean }>;
  revisionCount: number;
  clientRequests?: Array<{ request: string; date: string }>;
}

/**
 * Smart Proposal & SOW Generator Prompt
 */
export function createProposalPrompt(input: ProposalPromptInput): ChatMessage[] {
  const systemPrompt = `You are an expert business proposal writer specializing in software development and digital services. 
Your task is to create professional, compelling proposals that balance client needs with realistic delivery expectations.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid, complete JSON - no markdown code blocks, no explanations outside JSON
2. Ensure ALL arrays and objects are properly closed with matching brackets/braces
3. Keep deliverables array to maximum 6 items to avoid truncation
4. Keep milestone array to maximum 4 items
5. All string values must use proper escaping for quotes and special characters
6. Do not truncate the response - complete all fields before ending

Guidelines:
- Be clear, concise, and professional
- Break down deliverables into specific, measurable items
- Provide realistic timelines with milestones
- Include payment terms that protect both parties
- Suggest value-based pricing when appropriate
- Highlight unique value propositions

REQUIRED Output Format (complete this exact structure):
{
  "title": "Proposal title (max 100 chars)",
  "deliverables": [
    { "item": "Deliverable name", "description": "Details (max 200 chars)", "timeline": "2-3 weeks" }
  ],
  "timeline": {
    "total": "8-10 weeks",
    "milestones": [
      { "name": "Milestone 1", "duration": "2 weeks", "deliverables": ["D1", "D2"] }
    ]
  },
  "pricing": {
    "amount": 50000,
    "currency": "INR",
    "breakdown": [
      { "item": "Development", "cost": 30000 },
      { "item": "Design", "cost": 20000 }
    ]
  },
  "paymentTerms": "50% upfront, 25% at milestone 2, 25% on completion",
  "summary": "Brief executive summary (max 300 chars)"
}

IMPORTANT: Complete ALL fields. Do not truncate arrays. Close all brackets and braces.`;

  const userPrompt = `Create a professional proposal for:

**Client:** ${input.clientName}${input.company ? ` (${input.company})` : ''}
**Email:** ${input.clientEmail}
${input.budget ? `**Budget:** ${input.budget} INR` : ''}
${input.timeline ? `**Timeline:** ${input.timeline}` : ''}

**Client Brief:**
${input.brief}

${input.deliverables?.length ? `**Requested Deliverables:**\n${input.deliverables.map(d => `- ${d}`).join('\n')}` : ''}

Generate a detailed proposal with clear deliverables, timeline, and pricing.

RESPOND WITH COMPLETE VALID JSON ONLY. Ensure all arrays and objects are properly closed.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * AI Estimation & Pricing Assistant Prompt
 */
export function createEstimationPrompt(input: EstimationPromptInput): ChatMessage[] {
  const systemPrompt = `You are an expert project estimator for software development projects.
Your task is to analyze project requirements and provide accurate time and cost estimates.

CRITICAL: Return ONLY valid, complete JSON. No markdown formatting, no explanations outside JSON.

Output Format:
{
  "estimatedHours": 320,
  "estimatedCost": 480000,
  "confidence": 0.85,
  "breakdown": [
    { "phase": "Discovery & Planning", "hours": 40, "cost": 60000 },
    { "phase": "Development", "hours": 200, "cost": 300000 }
  ],
  "rationale": "Brief explanation (max 500 chars)",
  "riskFactors": [
    { "risk": "Description", "impact": "low|medium|high", "mitigation": "Brief solution" }
  ],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "suggestedPackages": [
    { "name": "MVP Package", "hours": 200, "cost": 300000, "description": "Brief desc" }
  ]
}

Keep rationale concise. Limit riskFactors to top 3. Limit assumptions to 5.`;

  const historicalContext = input.historicalData?.similarProjects.length
    ? `\n\n**Historical Data (Similar Projects):**
${input.historicalData.similarProjects.map(p =>
      `- ${p.name}: ${p.hours}h, ${p.cost} INR${p.actualVsEstimate ? ` (${p.actualVsEstimate > 0 ? '+' : ''}${p.actualVsEstimate}% variance)` : ''}`
    ).join('\n')}`
    : '';

  const userPrompt = `Estimate the time and cost for this project:

**Project Description:**
${input.projectDescription}

**Deliverables:**
${input.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

${input.clientBudget ? `**Client Budget:** ${input.clientBudget} INR` : ''}
${historicalContext}

Provide a detailed, accurate estimate with breakdown and package options.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * AI Weekly Client Updates Prompt
 */
export function createWeeklyUpdatePrompt(input: UpdatePromptInput): ChatMessage[] {
  const systemPrompt = `You are a professional client communication specialist.
Your task is to draft clear, positive, and transparent weekly project updates for clients.

Guidelines:
- Start with accomplishments and progress highlights
- Be honest about blockers but frame them constructively
- Include specific metrics (tasks completed, features shipped)
- Set clear expectations for next week
- Maintain professional but friendly tone
- Avoid technical jargon unless necessary

Output Format: Return ONLY valid JSON with this structure:
{
  "summary": "Brief 2-3 sentence overview of the week",
  "accomplishments": [
    { "title": "Feature shipped", "description": "Details", "impact": "User benefit" }
  ],
  "metrics": {
    "tasksCompleted": 12,
    "tasksInProgress": 5,
    "percentComplete": 65
  },
  "blockers": [
    { "issue": "Blocker description", "impact": "medium", "resolution": "How we're addressing it" }
  ],
  "nextSteps": [
    { "item": "Next milestone", "eta": "By Friday" }
  ],
  "emailDraft": "Full email text ready to send to client"
}`;

  const commitsSection = input.commits?.length
    ? `\n**Git Commits (${input.commits.length}):**
${input.commits.slice(0, 10).map(c => `- ${c.message} (${c.date})`).join('\n')}`
    : '';

  const tasksSection = input.tasksCompleted?.length
    ? `\n**Completed Tasks:**
${input.tasksCompleted.map(t => `- ${t.title}${t.description ? ': ' + t.description : ''}`).join('\n')}`
    : '';

  const inProgressSection = input.tasksInProgress?.length
    ? `\n**In Progress:**
${input.tasksInProgress.map(t => `- ${t.title}${t.blockers ? ' (Blocker: ' + t.blockers + ')' : ''}`).join('\n')}`
    : '';

  const userPrompt = `Draft a weekly update email for:

**Client:** ${input.clientName}
**Project:** ${input.projectName}
**Week:** ${input.weekStart} to ${input.weekEnd}
${commitsSection}
${tasksSection}
${inProgressSection}

Generate a professional client update with accomplishments, blockers, and next steps.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * Scope Sentinel (Scope Creep Detection) Prompt
 */
export function createScopeAnalysisPrompt(input: ScopePromptInput): ChatMessage[] {
  const systemPrompt = `You are an expert project scope analyst.
Your task is to detect scope creep by comparing original project scope with current tasks and client requests.

Guidelines:
- Identify tasks that fall outside original scope
- Assess risk level (low, medium, high)
- Detect patterns (feature bloat, requirement drift)
- Draft professional change order emails
- Provide impact estimates (time/cost)
- Suggest strategies to prevent future creep

Output Format: Return ONLY valid JSON with this structure:
{
  "creepRisk": 0.75,
  "riskLevel": "high",
  "outOfScopeCount": 8,
  "flaggedItems": [
    { 
      "item": "Task/request title", 
      "reason": "Why it's out of scope",
      "category": "feature_addition|requirement_change|technical_debt",
      "impact": { "hours": 20, "cost": 30000 }
    }
  ],
  "patterns": [
    "Client frequently requesting UI tweaks post-approval",
    "Requirements changing after design phase"
  ],
  "recommendations": [
    "Schedule scope review meeting",
    "Implement change request process"
  ],
  "changeOrderDraft": "Professional email draft requesting change order approval",
  "estimatedImpact": {
    "additionalHours": 80,
    "additionalCost": 120000,
    "timelineDelay": "2 weeks"
  }
}`;

  const clientRequestsSection = input.clientRequests?.length
    ? `\n**Recent Client Requests:**
${input.clientRequests.map(r => `- ${r.request} (${r.date})`).join('\n')}`
    : '';

  const userPrompt = `Analyze scope creep for:

**Project:** ${input.projectName}
**Revision Count:** ${input.revisionCount}

**Original Scope:**
${input.originalScope}

**Current Tasks:**
${input.currentTasks.map(t => `- [${t.isOriginal ? 'ORIGINAL' : 'NEW'}] ${t.title}: ${t.description}`).join('\n')}
${clientRequestsSection}

Identify scope creep, assess risk, and draft a change order email if needed.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
