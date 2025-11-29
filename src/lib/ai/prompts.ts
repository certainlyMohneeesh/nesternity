/**
 * prompts.ts — Fine-tuned (2025 market)
 *
 * Updated: 2025 market rates, clearer currency handling, safer defaults,
 * improved system prompts and minor API improvements (optional currency param)
 *
 * Notes:
 * - Exchange rates change; this file uses a working default EXCHANGE_RATE (INR per USD)
 *   which should be updated at runtime if exact conversions are required.
 * - System prompts ask the model to return strict JSON for downstream parsing.
 */

import { ChatMessage } from './types';

export interface ProposalPromptInput {
  clientName: string;
  clientEmail: string;
  company?: string;
  brief: string;
  budget?: number; // numeric budget in chosen currency
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
      actualVsEstimate?: number; // percentage
    }>;
  };
}

export interface UpdatePromptInput {
  clientName: string;
  projectName: string;
  weekStart: string; // ISO date or human-friendly
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

// Default exchange rate snapshot used for conversions in prompts only.
// IMPORTANT: Update at runtime (or replace with a live lookup) if you need an exact conversion.
export const EXCHANGE_RATE_INR_PER_USD = 89; // approximate Nov 2025 market (update as needed)

// Helper: safe currency label
function normCurrency(currency?: string) {
  const c = (currency || 'INR').toUpperCase();
  return c === 'INR' || c === 'USD' || c === 'EUR' ? c : 'INR';
}

/**
 * Smart Proposal & SOW Generator Prompt
 * - currency param is optional and defaults to 'INR'
 */
export function createProposalPrompt(input: ProposalPromptInput, currency?: string): ChatMessage[] {
  const C = normCurrency(currency);
  const currentYear = 2025; // pinned for prompt clarity

  // Market ranges (2025 snapshot). These are guidance numbers for the assistant —
  // kept conservative and realistic for freelancer/contractor quotes.
  const systemPrompt = `You are an expert business proposal writer specializing in software development with deep knowledge of ${currentYear} market rates.

CRITICAL PRICING GUIDELINES (${currentYear} snapshot):

**For INR (India) — indicative freelancer/contractor ranges:**
- Small web app / landing page: ₹50,000 - ₹200,000
- Medium web application: ₹200,000 - ₹800,000
- Large enterprise app: ₹800,000 - ₹3,000,000
- Mobile app (iOS/Android): ₹300,000 - ₹1,200,000
- E-commerce platform: ₹200,000 - ₹2,000,000 (template → custom marketplace)
- SaaS MVP: ₹800,000 - ₹2,500,000
- API / Backend system: ₹200,000 - ₹1,000,000

**Team Rates (INR/hour) — typical freelance bands:**
- Junior: ₹300 - ₹1,500/hr
- Mid-level: ₹1,000 - ₹2,500/hr
- Senior: ₹2,500 - ₹5,000/hr
- Designer: ₹800 - ₹2,500/hr

**For USD (international) — indicative ranges:**
- Small project: $500 - $5,000
- Medium project: $10,000 - $60,000
- Large project: $60,000 - $250,000+
- Mobile app: $15,000 - $150,000+
- SaaS MVP: $15,000 - $150,000+
- API / Backend: $5,000 - $50,000+

PRICING STRATEGY:
1. START with the realistic market range for the project type
2. ADJUST based on complexity, integrations, compliance
3. USE MID-RANGE pricing by default unless the scope clearly justifies premium
4. Account for actual development effort (realistic velocity)
5. Include buffer (15-20%) for unknowns
6. Consider team mix (junior/mid/senior) and non-billable overhead (project mgmt, handover)

CRITICAL INSTRUCTIONS:
1. Return ONLY valid, complete JSON — no markdown code fences, no extra text outside JSON
2. Ensure ALL arrays/objects are properly closed
3. Keep deliverables array to max 6 items; milestone array to max 4 items
4. All string values must be properly escaped
5. Do not truncate the response — complete all fields before ending
6. USE REALISTIC ${C} PRICING — clients prefer accurate over cheap

Guidelines:
- Be concise, professional and value-focused
- Break deliverables into measurable items
- Provide realistic timelines with clear milestones
- Include payment terms protecting both parties
- Prefer fixed-price for well-scoped work; hourly for exploratory work

REQUIRED Output Format (exact structure):
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
    "amount": 500000,
    "currency": "${C}",
    "breakdown": [
      { "item": "Development", "cost": 300000 },
      { "item": "Design", "cost": 100000 },
      { "item": "Testing & QA", "cost": 60000 },
      { "item": "Deployment", "cost": 40000 }
    ]
  },
  "paymentTerms": "50% upfront, 25% at milestone 2, 25% on completion",
  "summary": "Brief executive summary (max 300 chars)"
}

IMPORTANT: Complete ALL fields. Use MARKET-REALISTIC pricing. Do not truncate arrays.`;

  const userPrompt = `Create a professional proposal with REALISTIC ${C} pricing for:

**Client:** ${input.clientName}${input.company ? ` (${input.company})` : ''}
**Email:** ${input.clientEmail}
${input.budget ? `**Client Budget:** ${C} ${input.budget.toLocaleString()}` : ''}
${input.timeline ? `**Timeline:** ${input.timeline}` : ''}

**Client Brief:**

${input.brief}

${input.deliverables?.length ? `**Requested Deliverables:**\n${input.deliverables.map(d => `- ${d}`).join('\n')}` : ''}

**CRITICAL PRICING INSTRUCTIONS:**
1. Use realistic ${currentYear} ${C} market rates
2. Base pricing on actual development effort required
3. Include phase breakdown (Planning, Design, Development, Testing, Deployment)
4. Add 15-20% buffer for unknowns
5. If client budget is provided, stay within ±20% unless scope justifies otherwise
6. Be CONSERVATIVE — better to give realistic quote than lose client trust

Generate a detailed proposal with clear deliverables, realistic timeline, and MARKET-ACCURATE pricing.

RESPOND WITH COMPLETE VALID JSON ONLY. Ensure all arrays/objects are properly closed.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * AI Estimation & Pricing Assistant Prompt
 */
export function createEstimationPrompt(input: EstimationPromptInput, currency: string = 'INR'): ChatMessage[] {
  const C = normCurrency(currency);
  const systemPrompt = `You are an expert project estimator for software development projects with deep knowledge of global market rates (2025 snapshot).

CRITICAL PRICING GUIDELINES (${C}):

**Currency-specific freelance bands (2025 typical):**
- INR (India):
  - Junior Developer: ₹300-1,500/hour
  - Mid-Level Developer: ₹1,000-2,500/hour
  - Senior Developer: ₹2,500-5,000/hour
  - Full Stack: ₹1,500-3,500/hour
  - UI/UX Designer: ₹800-2,500/hour
  - Project Manager: ₹1,200-2,500/hour

- USD (International):
  - Junior Developer: $20-40/hour
  - Mid-Level Developer: $40-80/hour
  - Senior Developer: $70-150+/hour
  - Full Stack: $50-100/hour
  - UI/UX Designer: $35-80/hour
  - Project Manager: $50-100/hour

ESTIMATION STRATEGY:
1. ALWAYS check historical data first - learn from past projects
2. Use conservative estimates and include a 15-20% buffer
3. Break down by phases: Planning (10%), Design (15%), Development (50%), Testing (15%), Deployment (10%)
4. Account for realistic team mix
5. Account for non-billable and coordination overhead

CRITICAL: Return ONLY valid, complete JSON. No markdown or extra text.

Output Format:
{
  "estimatedBudget": 480000,
  "confidence": "high",
  "breakdown": [
    { "category": "Discovery & Planning", "amount": 60000, "reasoning": "Requirements gathering, architecture planning" },
    { "category": "UI/UX Design", "amount": 80000, "reasoning": "Wireframes, mockups, prototypes" },
    { "category": "Development", "amount": 250000, "reasoning": "Core features, integrations, testing" },
    { "category": "QA & Testing", "amount": 50000, "reasoning": "Testing, bug fixes, optimization" },
    { "category": "Deployment & Training", "amount": 40000, "reasoning": "Launch, documentation, client training" }
  ],
  "rationale": "Brief explanation based on scope, team mix, and market rates (max 500 chars)"
}

Keep rationale concise and data-driven.`;

  const historicalContext = input.historicalData?.similarProjects?.length
    ? `\n\n**YOUR HISTORICAL DATA (Learn from this!):**\n\n${input.historicalData.similarProjects.map(p =>
      `- ${p.name}: Estimated ${C} ${p.cost.toLocaleString()}${p.actualVsEstimate ? ` | Actual variance: ${p.actualVsEstimate > 0 ? '+' : ''}${p.actualVsEstimate}%` : ''}`
    ).join('\n')}

**IMPORTANT:** Analyze these past projects. If estimates were consistently too low/high, adjust accordingly.`
    : '';

  const userPrompt = `Estimate the budget for this project using **${C}** and current market rates (2025 snapshot):

**Project Description:**

${input.projectDescription}

**Deliverables:**
${input.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

${input.clientBudget ? `**Client Budget Expectation:** ${C} ${input.clientBudget.toLocaleString()}` : ''}
${historicalContext}

**INSTRUCTIONS:**
1. Use realistic ${C} market rates for 2025
2. Be CONSERVATIVE - accuracy over low-ball numbers
3. Learn from historical data patterns
4. Break down by development phases
5. Account for realistic team composition
6. Include buffer for unknowns (15-20%)
7. Consider project complexity and technical risks

Provide a detailed, market-accurate estimate.`;

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
- Avoid unnecessary technical jargon

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
    ? `\n**Git Commits (${input.commits.length}):**\n${input.commits.slice(0, 10).map(c => `- ${c.message} (${c.date})`).join('\n')}`
    : '';

  const tasksSection = input.tasksCompleted?.length
    ? `\n**Completed Tasks:**\n${input.tasksCompleted.map(t => `- ${t.title}${t.description ? ': ' + t.description : ''}`).join('\n')}`
    : '';

  const inProgressSection = input.tasksInProgress?.length
    ? `\n**In Progress:**\n${input.tasksInProgress.map(t => `- ${t.title}${t.blockers ? ' (Blocker: ' + t.blockers + ')' : ''}`).join('\n')}`
    : '';

  const userPrompt = `Draft a weekly update email for:\n\n**Client:** ${input.clientName}\n**Project:** ${input.projectName}\n**Week:** ${input.weekStart} to ${input.weekEnd}${commitsSection}${tasksSection}${inProgressSection}\n\nGenerate a professional client update with accomplishments, blockers, and next steps.`;

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
    ? `\n**Recent Client Requests:**\n${input.clientRequests.map(r => `- ${r.request} (${r.date})`).join('\n')}`
    : '';

  const userPrompt = `Analyze scope creep for:\n\n**Project:** ${input.projectName}\n**Revision Count:** ${input.revisionCount}\n\n**Original Scope:**\n\n${input.originalScope}\n\n**Current Tasks:**\n${input.currentTasks.map(t => `- [${t.isOriginal ? 'ORIGINAL' : 'NEW'}] ${t.title}: ${t.description}`).join('\n')}\n${clientRequestsSection}\n\nIdentify scope creep, assess risk, and draft a change order email if needed.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
