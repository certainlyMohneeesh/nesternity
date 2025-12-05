/**
 * prompts.ts — Fine-tuned (2025 market) with History Learning & Deep Reasoning
 *
 * Updated: 2025 market rates, clearer currency handling, safer defaults,
 * improved system prompts with chain-of-thought reasoning and historical learning.
 *
 * Features:
 * - Historical proposal learning: Analyzes past successful proposals
 * - Deep reasoning: Multi-step analysis before generating output
 * - Adaptive pricing: Learns from acceptance/rejection patterns
 * - Context-aware: Uses organization and client history
 *
 * Notes:
 * - Exchange rates change; this file uses a working default EXCHANGE_RATE (INR per USD)
 *   which should be updated at runtime if exact conversions are required.
 * - System prompts ask the model to return strict JSON for downstream parsing.
 */

import { ChatMessage } from './types';

/** Historical proposal data for learning */
export interface HistoricalProposal {
  id: string;
  title: string;
  brief: string;
  deliverables: string[];
  pricing: {
    amount: number;
    currency: string;
  };
  timeline: string;
  status: 'accepted' | 'rejected' | 'pending' | 'draft';
  clientFeedback?: string;
  successFactors?: string[];
  createdAt: Date;
}

/** Organization context for proposal generation */
export interface OrganizationContext {
  name: string;
  industry?: string;
  averageProjectValue?: number;
  preferredPaymentTerms?: string;
  typicalTimelines?: string;
}

export interface ProposalPromptInput {
  clientName: string;
  clientEmail: string;
  company?: string;
  brief: string;
  budget?: number; // numeric budget in chosen currency
  timeline?: string;
  deliverables?: string[];
  // History learning inputs
  historicalProposals?: HistoricalProposal[];
  organizationContext?: OrganizationContext;
  enableReasoning?: boolean;
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
 * Build historical analysis section from past proposals
 * This enables the AI to learn from past successful/rejected proposals
 */
function buildHistoricalAnalysis(proposals?: HistoricalProposal[]): string {
  if (!proposals || proposals.length === 0) {
    return '';
  }

  const accepted = proposals.filter(p => p.status === 'accepted');
  const rejected = proposals.filter(p => p.status === 'rejected');
  
  // Calculate success patterns
  const avgAcceptedPrice = accepted.length > 0 
    ? accepted.reduce((sum, p) => sum + p.pricing.amount, 0) / accepted.length 
    : 0;
  
  const avgRejectedPrice = rejected.length > 0 
    ? rejected.reduce((sum, p) => sum + p.pricing.amount, 0) / rejected.length 
    : 0;

  let analysis = `## HISTORICAL LEARNING DATA
You have access to ${proposals.length} past proposals from this organization.

**Success Metrics:**
- Accepted proposals: ${accepted.length}
- Rejected proposals: ${rejected.length}
- Acceptance rate: ${proposals.length > 0 ? Math.round((accepted.length / proposals.length) * 100) : 0}%
${avgAcceptedPrice > 0 ? `- Average accepted price: ${accepted[0]?.pricing.currency || 'INR'} ${avgAcceptedPrice.toLocaleString()}` : ''}
${avgRejectedPrice > 0 ? `- Average rejected price: ${rejected[0]?.pricing.currency || 'INR'} ${avgRejectedPrice.toLocaleString()}` : ''}
`;

  if (accepted.length > 0) {
    analysis += `
**SUCCESSFUL PROPOSALS TO LEARN FROM:**
${accepted.slice(0, 3).map(p => `
📗 "${p.title}"
- Brief: ${p.brief.slice(0, 150)}...
- Price: ${p.pricing.currency} ${p.pricing.amount.toLocaleString()}
- Timeline: ${p.timeline || 'Not specified'}
${p.successFactors?.length ? `- Success factors: ${p.successFactors.join(', ')}` : ''}
${p.clientFeedback ? `- Client feedback: "${p.clientFeedback}"` : ''}`).join('\n')}
`;
  }

  if (rejected.length > 0) {
    analysis += `
**REJECTED PROPOSALS TO LEARN FROM (Avoid these patterns):**
${rejected.slice(0, 2).map(p => `
📕 "${p.title}"
- Brief: ${p.brief.slice(0, 100)}...
- Price: ${p.pricing.currency} ${p.pricing.amount.toLocaleString()}
${p.clientFeedback ? `- Rejection reason: "${p.clientFeedback}"` : ''}`).join('\n')}
`;
  }

  analysis += `
**LEARNING INSIGHTS:**
- Learn from accepted proposals: What made them successful?
- Avoid patterns from rejected proposals
- Price competitively but realistically based on historical acceptance
- Match successful proposal structures and value propositions
`;

  return analysis;
}

/**
 * Build organization context section
 */
function buildOrganizationContext(context?: OrganizationContext): string {
  if (!context) {
    return '';
  }

  return `## ORGANIZATION CONTEXT
**Organization:** ${context.name}
${context.industry ? `**Industry:** ${context.industry}` : ''}
${context.averageProjectValue ? `**Typical Project Value:** ${context.averageProjectValue.toLocaleString()}` : ''}
${context.preferredPaymentTerms ? `**Preferred Payment Terms:** ${context.preferredPaymentTerms}` : ''}
${context.typicalTimelines ? `**Typical Timelines:** ${context.typicalTimelines}` : ''}

Use this context to align the proposal with organization standards.
`;
}

/**
 * Smart Proposal & SOW Generator Prompt with History Learning & Deep Reasoning
 * - currency param is optional and defaults to 'INR'
 * - Now includes analysis of historical proposals for pattern learning
 * - Chain-of-thought reasoning for better outputs
 */
export function createProposalPrompt(input: ProposalPromptInput, currency?: string): ChatMessage[] {
  const C = normCurrency(currency);
  const currentYear = 2025; // pinned for prompt clarity
  const useReasoning = input.enableReasoning !== false; // enabled by default

  // Analyze historical proposals for learning
  const historicalAnalysis = buildHistoricalAnalysis(input.historicalProposals);
  const orgContext = buildOrganizationContext(input.organizationContext);

  // Market ranges (2025 snapshot). These are guidance numbers for the assistant —
  // kept conservative and realistic for freelancer/contractor quotes.
  const systemPrompt = `You are an expert business proposal writer specializing in software development with deep knowledge of ${currentYear} market rates.

${useReasoning ? `## REASONING FRAMEWORK
Before generating the proposal, you MUST think through these steps internally:

1. **UNDERSTAND**: What exactly is the client asking for? What's the core problem they're solving?
2. **ANALYZE**: What are the technical requirements, complexity factors, and potential challenges?
3. **BENCHMARK**: How does this compare to similar projects in terms of scope and complexity?
4. **PRICE**: Based on market rates and historical data, what's the fair price range?
5. **STRUCTURE**: How should deliverables be phased for optimal project flow?
6. **RISK**: What are the unknowns and how much buffer is needed?

Take your time to reason through each step. Quality and accuracy matter more than speed.
` : ''}

${historicalAnalysis}

${orgContext}

CRITICAL PRICING GUIDELINES (${currentYear} India Market - Realistic Freelancer Rates):

**For INR (India) — ACTUAL freelancer/contractor ranges (Dec 2025):**
- Simple landing page / portfolio: ₹15,000 - ₹50,000
- Small web app (5-10 pages): ₹30,000 - ₹80,000
- Medium web application: ₹80,000 - ₹250,000
- Large/complex web app: ₹250,000 - ₹600,000
- Enterprise application: ₹500,000 - ₹1,500,000
- Mobile app (single platform): ₹80,000 - ₹300,000
- Mobile app (cross-platform): ₹150,000 - ₹500,000
- E-commerce (template-based): ₹40,000 - ₹150,000
- E-commerce (custom): ₹150,000 - ₹500,000
- SaaS MVP (basic): ₹200,000 - ₹500,000
- SaaS (full-featured): ₹500,000 - ₹1,200,000
- API / Backend system: ₹50,000 - ₹300,000
- WordPress/CMS site: ₹20,000 - ₹80,000

**Hourly Rates (INR) — Indian freelancer market reality:**
- Fresher/Intern: ₹150 - ₹400/hr
- Junior (1-2 yrs): ₹400 - ₹800/hr
- Mid-level (3-5 yrs): ₹800 - ₹1,500/hr
- Senior (5+ yrs): ₹1,500 - ₹3,000/hr
- Expert/Architect: ₹3,000 - ₹5,000/hr
- UI/UX Designer: ₹500 - ₹1,500/hr
- DevOps/Cloud: ₹1,000 - ₹2,500/hr

**For USD (international clients) — indicative ranges:**
- Small project: $300 - $2,000
- Medium project: $2,000 - $15,000
- Large project: $15,000 - $50,000
- Enterprise: $50,000 - $150,000+
- Mobile app: $3,000 - $30,000
- SaaS MVP: $5,000 - $40,000
- API / Backend: $1,500 - $15,000

PRICING STRATEGY:
1. START with the LOWER to MID range for the project type - Indian clients are price-sensitive
2. ADJUST upward only for: complex integrations, strict compliance, tight deadlines, premium support
3. USE LOWER-MID range pricing by default — competitive pricing wins more projects
4. Calculate based on realistic Indian developer velocity (6-8 productive hours/day)
5. Include modest buffer (10-15%) for unknowns — don't over-inflate
6. Consider that most Indian freelancers work solo or small teams — lower overhead
7. Factor in that clients compare with Upwork/Fiverr rates — stay competitive
8. If client has a budget, try to work within it or explain clearly why more is needed

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
  "summary": "Brief executive summary (max 300 chars)",
  "executiveSummary": "Detailed executive summary explaining value proposition (max 500 chars)",
  "scopeOfWork": "Comprehensive scope description (max 800 chars)",
  "reasoning": {
    "pricingRationale": "Why this price point was chosen based on scope, complexity, and market rates",
    "timelineRationale": "Why this timeline is realistic given the deliverables",
    "risksIdentified": ["Risk 1", "Risk 2"],
    "assumptions": ["Assumption 1", "Assumption 2"]
  }
}

IMPORTANT: Complete ALL fields including the reasoning section. Use MARKET-REALISTIC pricing. Do not truncate arrays.`;

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

CRITICAL PRICING GUIDELINES (${C}) - Realistic 2025 Market Rates:

**INR (India) — Actual Freelancer Hourly Rates:**
- Fresher/Intern: ₹150-400/hour
- Junior Developer (1-2 yrs): ₹400-800/hour
- Mid-Level Developer (3-5 yrs): ₹800-1,500/hour
- Senior Developer (5+ yrs): ₹1,500-3,000/hour
- Full Stack Developer: ₹800-2,000/hour
- UI/UX Designer: ₹500-1,500/hour
- DevOps Engineer: ₹1,000-2,500/hour
- Project Manager: ₹800-1,800/hour

**INR Project-Based Estimates (Freelancer/Small Agency):**
- Landing page: ₹15,000-50,000
- Simple website (5-10 pages): ₹30,000-80,000
- Web application (medium): ₹80,000-250,000
- Mobile app (single platform): ₹80,000-300,000
- E-commerce (Shopify/WooCommerce): ₹40,000-150,000
- Custom web app: ₹150,000-500,000
- API development: ₹50,000-200,000

**USD (International) — Competitive Indian Freelancer Rates:**
- Junior Developer: $8-15/hour
- Mid-Level Developer: $15-30/hour
- Senior Developer: $30-50/hour
- Full Stack: $20-40/hour
- UI/UX Designer: $15-35/hour
- Project Manager: $20-40/hour

ESTIMATION STRATEGY:
1. ALWAYS check historical data first - learn from past projects
2. Use COMPETITIVE estimates - Indian market is price-sensitive
3. Include modest buffer (10-15%) — don't over-inflate
4. Break down by phases: Planning (5-8%), Design (10-15%), Development (55-60%), Testing (12-15%), Deployment (5-8%)
5. Assume solo freelancer or small team (2-3 people) — lower coordination overhead
6. Calculate realistic hours: most features take 4-20 hours, not days
7. Compare with Upwork/Freelancer rates to stay competitive
8. If estimate seems high, double-check — simpler solutions often exist

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

/**
 * AI Newsletter Generator Prompt
 */
export interface NewsletterPromptInput {
  topic: string;
  tone?: 'professional' | 'casual' | 'friendly';
  sections?: number;
  includeCallToAction?: boolean;
}

export function createNewsletterPrompt(input: NewsletterPromptInput): ChatMessage[] {
  const tone = input.tone || 'professional';
  const sections = input.sections || 3;
  const includeCTA = input.includeCallToAction !== false;

  const systemPrompt = `You are an expert newsletter writer for Nesternity, a modern SaaS CRM platform for teams, projects, and client management.

Your task is to create engaging, valuable newsletter content that:
- Provides actionable insights and tips
- Showcases product updates and features
- Delivers value to users (project managers, freelancers, agencies)
- Maintains a ${tone} tone
- Uses clean, professional formatting

Guidelines:
- Start with a catchy subject line (max 50 characters)
- Use a warm, personalized greeting
- Structure content with clear sections and headings
- Include practical tips, insights, or updates
- Use storytelling when appropriate
- Keep paragraphs short (2-3 sentences max)
- End with a clear call-to-action${includeCTA ? '' : ' (if relevant)'}
- Format in clean HTML with proper spacing

Output Format: Return ONLY valid JSON with this structure:
{
  "subject": "Catchy subject line (max 50 chars)",
  "preheader": "Preview text for email clients (max 100 chars)",
  "content": "Plain text version of email",
  "htmlContent": "Full HTML version with formatting, headings, and styling"
}

IMPORTANT:
- Make it valuable - every newsletter should teach or help
- Be genuine - write like a real person, not a marketing robot
- Use specific examples when possible
- Include 2-3 emoji in the HTML version for visual interest (but sparingly)
- Keep total length to 400-600 words
- HTML should be responsive and email-client compatible`;

  const userPrompt = `Create an engaging newsletter for Nesternity users about:

**Topic:** ${input.topic}

**Tone:** ${tone}
**Target Sections:** ${sections}

**Additional Context:**
- Nesternity is a comprehensive CRM with: team management, project tracking, invoicing, proposals, client management, task boards
- Our users are: freelancers, agencies, project managers, small businesses
- Focus on practical value and actionable insights

Create a ${tone} newsletter that provides real value to our users. Include:
1. Eye-catching subject that promises value
2. Warm greeting addressing the community
3. ${sections} main content sections with insights/tips/updates
4. ${includeCTA ? 'A clear call-to-action' : 'Natural conclusion'}

Respond with complete valid JSON only.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
