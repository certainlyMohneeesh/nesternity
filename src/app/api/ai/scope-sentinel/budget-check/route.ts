/**
 * POST /api/ai/scope-sentinel/budget-check
 * Monitor project budget vs actual spend, detect overruns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { generateStructuredCompletion } from '@/lib/ai/gemini';
import { createScopeRadarNotification, ACTIVITY_TYPES } from '@/lib/notifications';

interface BudgetCheckRequest {
  projectId?: string;
  clientId?: string;
}

interface BudgetCheckResponse {
  originalBudget: number;
  currentSpend: number;
  invoiceTotal: number;
  remainingBudget: number;
  overrunAmount: number;
  overrunPercent: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  projectedTotal: number;
  currency: string;
  clientEmailDraft: string;
  recommendations: string[];
  flaggedInvoices: Array<{
    invoiceNumber: string;
    amount: number;
    date: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[BudgetCheckAPI] POST - Starting budget check');
    
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[BudgetCheckAPI] Unauthorized - No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[BudgetCheckAPI] User authenticated:', user.id);

    // 2. Parse request
    const body = await request.json() as BudgetCheckRequest;
    const { projectId, clientId } = body;

    console.log('[BudgetCheckAPI] Request body:', { projectId, clientId });

    if (!projectId && !clientId) {
      console.error('[BudgetCheckAPI] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required field: projectId or clientId' },
        { status: 400 }
      );
    }

    // 3. Fetch data based on what's provided
    let client: { id: string; name: string; email: string | null; budget: number | null; currency: string | null } | null = null;
    let proposals: any[] = [];
    
    if (projectId) {
      console.log(`[BudgetCheckAPI] Fetching by projectId: ${projectId}`);
      
      // Fetch project with client and proposals
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              budget: true,
              currency: true,
            },
          },
          proposals: {
            where: {
              status: 'ACCEPTED',
            },
            orderBy: {
              acceptedAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!project) {
        console.error('[BudgetCheckAPI] Project not found');
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      if (!project.client) {
        console.error('[BudgetCheckAPI] Project has no client');
        return NextResponse.json({ error: 'Project has no client' }, { status: 400 });
      }

      client = project.client;
      proposals = project.proposals;
      console.log(`[BudgetCheckAPI] Found project client: ${client.name}`);
    } else if (clientId) {
      console.log(`[BudgetCheckAPI] Fetching by clientId: ${clientId}`);
      
      // Fetch client directly
      const clientData = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          email: true,
          budget: true,
          currency: true,
        },
      });

      if (!clientData) {
        console.error('[BudgetCheckAPI] Client not found');
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      client = clientData;
      
      // Get accepted proposals for this client
      proposals = await prisma.proposal.findMany({
        where: {
          clientId: clientId,
          status: 'ACCEPTED',
        },
        orderBy: {
          acceptedAt: 'desc',
        },
        take: 1,
      });
      
      console.log(`[BudgetCheckAPI] Found client: ${client.name}`);
    }

    if (!client) {
      console.error('[BudgetCheckAPI] Client not found');
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 4. Get all invoices for this client
    console.log(`[BudgetCheckAPI] Fetching invoices for client: ${client.id}`);
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId: client.id,
        status: {
          in: ['PENDING', 'PAID'],
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        issuedDate: 'desc',
      },
    });

    console.log(`[BudgetCheckAPI] Found ${invoices.length} invoices`);

    // 5. Calculate budget baseline
    let originalBudget = 0;
    const currency = client.currency || 'INR';

    // Priority: 1. Accepted proposal, 2. Client budget
    if (proposals.length > 0) {
      originalBudget = proposals[0].pricing;
      console.log(`[BudgetCheckAPI] Using proposal budget: ${currency} ${originalBudget}`);
    } else if (client.budget) {
      originalBudget = client.budget;
      console.log(`[BudgetCheckAPI] Using client budget: ${currency} ${originalBudget}`);
    } else {
      console.warn('[BudgetCheckAPI] No budget found for client');
      return NextResponse.json(
        {
          error: 'No budget found',
          message: 'Set client budget or create accepted proposal first',
        },
        { status: 400 }
      );
    }

    // 6. Calculate current spend (sum of all invoices)
    const invoiceTotal = invoices.reduce((sum, invoice) => {
      const itemsTotal = invoice.items.reduce((iSum, item) => iSum + item.total, 0);
      const tax = itemsTotal * ((invoice.taxRate || 0) / 100);
      const discount = itemsTotal * ((invoice.discount || 0) / 100);
      return sum + (itemsTotal + tax - discount);
    }, 0);

    console.log(`[BudgetCheckAPI] Total invoiced: ${currency} ${invoiceTotal}`);

    // 7. Calculate metrics
    const remainingBudget = originalBudget - invoiceTotal;
    const overrunAmount = Math.max(0, invoiceTotal - originalBudget);
    const overrunPercent = originalBudget > 0 
      ? (overrunAmount / originalBudget) * 100 
      : 0;

    // 8. Determine risk level
    const spendPercent = (invoiceTotal / originalBudget) * 100;
    let riskLevel: 'safe' | 'warning' | 'critical';

    if (spendPercent >= 100) {
      riskLevel = 'critical';
    } else if (spendPercent >= 80) {
      riskLevel = 'warning';
    } else {
      riskLevel = 'safe';
    }

    console.log(`[BudgetCheckAPI] Risk level: ${riskLevel} (${spendPercent.toFixed(1)}% spent)`);

    // 9. Project future spend (if scope creep detected)
    // Only check for scope radar if we have a projectId
    let scopeRadar = null;
    if (projectId) {
      scopeRadar = await prisma.scopeRadar.findFirst({
        where: {
          projectId,
          acknowledged: false,
        },
        orderBy: {
          flaggedAt: 'desc',
        },
      });
    }

    let projectedTotal = invoiceTotal;
    if (scopeRadar && scopeRadar.estimatedImpact) {
      const impact = scopeRadar.estimatedImpact as any;
      projectedTotal += impact.additionalCost || 0;
      console.log(`[BudgetCheckAPI] Scope creep detected, projected total: ${currency} ${projectedTotal}`);
    }

    // 10. Generate AI recommendations and client email
    const clientName = client.name;
    const messages = [
      {
        role: 'system' as const,
        content: `You are a project budget advisor. Generate professional recommendations and client communication.`,
      },
      {
        role: 'user' as const,
        content: `Budget Analysis:

**Client:** ${clientName}
**Original Budget:** ${currency} ${originalBudget.toLocaleString()}
**Current Spend:** ${currency} ${invoiceTotal.toLocaleString()}
**Remaining:** ${currency} ${remainingBudget.toLocaleString()}
**Risk Level:** ${riskLevel.toUpperCase()}
${overrunPercent > 0 ? `**Budget Overrun:** ${overrunPercent.toFixed(1)}%` : ''}

**Recent Invoices:**
${invoices.slice(0, 5).map(inv => `- ${inv.invoiceNumber}: ${currency} ${inv.items.reduce((s, i) => s + i.total, 0).toLocaleString()}`).join('\n')}

${scopeRadar ? `**Scope Creep Detected:** ${scopeRadar.outOfScopeCount} items flagged` : ''}

Generate:
1. A professional email to the client (if risk is warning/critical) explaining budget status
2. 3-5 actionable recommendations

Return JSON:
{
  "clientEmailDraft": "Professional email HTML (empty string if safe)",
  "recommendations": ["rec1", "rec2", "rec3"]
}`,
      },
    ];

    const aiResult = await generateStructuredCompletion<{
      clientEmailDraft: string;
      recommendations: string[];
    }>(messages, {
      temperature: 0.7,
      maxTokens: 2048,
    });

    // 11. Save to ScopeRadar if not safe (only if we have projectId)
    let scopeRadarId: string | undefined;

    if (riskLevel !== 'safe' && projectId) {
      const existingRadar = await prisma.scopeRadar.findFirst({
        where: {
          projectId,
          budgetOverrun: {
            gte: overrunAmount - 1000, // Within 1000 of current
          },
          emailSent: false,
        },
      });

      if (!existingRadar) {
        const newRadar = await prisma.scopeRadar.create({
          data: {
            projectId,
            creepRisk: riskLevel === 'critical' ? 0.9 : 0.6,
            revisionCount: 0,
            outOfScopeCount: 0,
            originalBudget,
            currentEstimate: invoiceTotal,
            budgetOverrun: overrunAmount,
            budgetOverrunPercent: overrunPercent,
            flaggedItems: invoices.slice(0, 5).map(inv => ({
              item: inv.invoiceNumber,
              amount: inv.items.reduce((s, i) => s + i.total, 0),
              date: inv.issuedDate.toISOString(),
            })),
            clientEmailDraft: aiResult.data.clientEmailDraft,
            recommendations: aiResult.data.recommendations,
            aiModel: 'gemini-2.5-flash',
          },
        });
        scopeRadarId = newRadar.id;
        console.log(`[BudgetCheckAPI] Created scope radar alert: ${scopeRadarId}`);

        // Send notification to user
        try {
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { team: true }
          });

          if (project) {
            const notificationType = overrunPercent > 0 
              ? ACTIVITY_TYPES.BUDGET_EXCEEDED 
              : ACTIVITY_TYPES.BUDGET_WARNING;
            
            await createScopeRadarNotification(
              user.id,
              notificationType,
              project.name,
              riskLevel === 'critical' ? 'critical' : 'high',
              {
                original: originalBudget,
                current: invoiceTotal,
                overrun: overrunAmount,
                currency
              },
              {
                teamId: project.teamId,
                projectId: project.id,
                clientName,
                scopeRadarId: newRadar.id
              }
            );
            console.log(`[BudgetCheckAPI] Notification sent for ${notificationType}`);
          }
        } catch (notifError) {
          console.error('[BudgetCheckAPI] Failed to send notification:', notifError);
          // Don't fail the request if notification fails
        }
      } else {
        console.log(`[BudgetCheckAPI] Existing radar found, skipping creation`);
      }
    } else if (riskLevel !== 'safe' && !projectId) {
      console.log(`[BudgetCheckAPI] Risk detected but no projectId, skipping ScopeRadar creation`);
    }

    console.log(`[BudgetCheckAPI] Budget check complete - Risk: ${riskLevel}`);

    const response: BudgetCheckResponse = {
      originalBudget,
      currentSpend: invoiceTotal,
      invoiceTotal,
      remainingBudget,
      overrunAmount,
      overrunPercent,
      riskLevel,
      projectedTotal,
      currency,
      clientEmailDraft: aiResult.data.clientEmailDraft,
      recommendations: aiResult.data.recommendations,
      flaggedInvoices: invoices.slice(0, 5).map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        amount: inv.items.reduce((s, i) => s + i.total, 0),
        date: inv.issuedDate.toLocaleDateString(),
      })),
    };

    return NextResponse.json({
      success: true,
      ...response,
      scopeRadarId,
    });

  } catch (error) {
    console.error('[BudgetCheckAPI] Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to check budget',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/scope-sentinel/budget-check?projectId=xxx&clientId=xxx
 * Get latest budget status
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[BudgetCheckAPI] GET - Fetching budget status');
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[BudgetCheckAPI] GET - Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');

    console.log('[BudgetCheckAPI] GET - Query params:', { projectId, clientId });

    if (!projectId && !clientId) {
      console.error('[BudgetCheckAPI] GET - Missing required parameters');
      return NextResponse.json({ 
        error: 'Missing required parameter: projectId or clientId' 
      }, { status: 400 });
    }

    // If we have clientId, we need to find projects for that client
    // and get the latest radar across all projects
    let latestRadar;
    
    if (clientId) {
      console.log(`[BudgetCheckAPI] GET - Searching by clientId: ${clientId}`);
      
      // Get all projects for this client
      const projects = await prisma.project.findMany({
        where: { clientId },
        select: { id: true },
      });

      const projectIds = projects.map(p => p.id);
      console.log(`[BudgetCheckAPI] GET - Found ${projectIds.length} projects for client`);

      if (projectIds.length === 0) {
        console.warn('[BudgetCheckAPI] GET - No projects found for client');
        return NextResponse.json({ 
          error: 'No projects found for this client' 
        }, { status: 404 });
      }

      latestRadar = await prisma.scopeRadar.findFirst({
        where: {
          projectId: { in: projectIds },
          budgetOverrun: {
            not: null,
          },
        },
        orderBy: {
          flaggedAt: 'desc',
        },
      });
    } else {
      console.log(`[BudgetCheckAPI] GET - Searching by projectId: ${projectId}`);
      
      latestRadar = await prisma.scopeRadar.findFirst({
        where: {
          projectId: projectId!,
          budgetOverrun: {
            not: null,
          },
        },
        orderBy: {
          flaggedAt: 'desc',
        },
      });
    }

    if (!latestRadar) {
      console.warn('[BudgetCheckAPI] GET - No budget data found');
      return NextResponse.json({ 
        error: 'No budget data found' 
      }, { status: 404 });
    }

    console.log('[BudgetCheckAPI] GET - Found radar data:', latestRadar.id);

    return NextResponse.json({
      success: true,
      radar: latestRadar,
    });

  } catch (error) {
    console.error('[BudgetCheckAPI] GET - Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to get budget status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
