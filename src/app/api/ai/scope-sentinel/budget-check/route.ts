/**
 * POST /api/ai/scope-sentinel/budget-check
 * Monitor project budget vs actual spend, detect overruns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import adapter from '@/lib/ai/adapter';
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
    let project: any = null;

    if (projectId) {
      console.log(`[BudgetCheckAPI] Fetching by projectId: ${projectId}`);

      // Fetch project with client and proposals
      project = await prisma.project.findUnique({ // Fetching project data
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

      // Client is optional - projects can exist without clients
      if (project.client) {
        client = project.client;
        console.log(`[BudgetCheckAPI] Found project client: ${client?.name}`);
      } else {
        console.log(`[BudgetCheckAPI] Project has no client, will use project budget and organisationId`);
      }
      proposals = project.proposals;
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

    // Client is optional when we have projectId
    // If no client and no projectId, then error
    if (!client && !projectId) {
      console.error('[BudgetCheckAPI] Neither client nor project found');
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 4. Get all invoices - by clientId if available, otherwise by organisationId
    let invoices: any[] = [];
    if (client) {
      console.log(`[BudgetCheckAPI] Fetching invoices for client: ${client.id}`);
      invoices = await prisma.invoice.findMany({
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
    } else if (project?.organisationId) {
      console.log(`[BudgetCheckAPI] Fetching invoices for organisation: ${project.organisationId}`);
      invoices = await prisma.invoice.findMany({
        where: {
          organisationId: project.organisationId,
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
    } else {
      console.warn('[BudgetCheckAPI] No client or organisation found');
      invoices = [];
    }

    console.log(`[BudgetCheckAPI] Found ${invoices.length} invoices`);

    // 5. Calculate budget baseline
    let originalBudget = 0;
    // Default currency to INR if not found in client or project
    let currency = client?.currency || project?.currency || 'INR';

    // Priority: 1. Project Budget (if projectId exists), 2. Accepted Proposal, 3. Client Budget
    if (projectId && project?.budget) {
      originalBudget = project.budget;
      currency = project.currency || currency;
      console.log(`[BudgetCheckAPI] Using project budget: ${currency} ${originalBudget}`);
    } else if (proposals.length > 0) {
      originalBudget = proposals[0].pricing;
      currency = proposals[0].currency || currency;
      console.log(`[BudgetCheckAPI] Using proposal budget: ${currency} ${originalBudget}`);
    } else if (client?.budget) {
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
      const itemsTotal = invoice.items.reduce((iSum: number, item: any) => iSum + item.total, 0);
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
    const clientName = client?.name || project?.name || 'Client';
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
${invoices.slice(0, 5).map(inv => `- ${inv.invoiceNumber}: ${currency} ${inv.items.reduce((s: number, i: any) => s + i.total, 0).toLocaleString()}`).join('\n')}

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

    const aiResult = await adapter.generateStructuredCompletion<{
      clientEmailDraft: string;
      recommendations: string[];
    }>(messages, {
      temperature: 0.7,
      maxTokens: 2048,
    });

    // 11. Save to ScopeRadar if not safe (only if we have projectId)
    let scopeRadarId: string | undefined;

    if (projectId) {
      // Always find existing radar for this project
      const existingRadar = await prisma.scopeRadar.findFirst({
        where: { projectId },
        orderBy: { flaggedAt: 'desc' },
      });

      if (riskLevel === 'safe') {
        // If safe and radar exists, delete it
        if (existingRadar) {
          await prisma.scopeRadar.delete({
            where: { id: existingRadar.id },
          });
          console.log(`[BudgetCheckAPI] Deleted radar - budget is safe now`);
        } else {
          console.log(`[BudgetCheckAPI] Budget is safe, no radar needed`);
        }
      } else {
        // Risk is warning or critical - create or update radar
        if (!existingRadar) {
          // Create new radar
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
                amount: inv.items.reduce((s: number, i: any) => s + i.total, 0),
                date: inv.issuedDate.toISOString(),
              })),
              clientEmailDraft: aiResult.data.clientEmailDraft,
              recommendations: aiResult.data.recommendations,
              aiModel: 'gemini-2.5-flash',
            },
          });
          scopeRadarId = newRadar.id;
          console.log(`[BudgetCheckAPI] Created new scope radar alert: ${scopeRadarId}`);
        } else {
          // Update existing radar with latest data
          console.log(`[BudgetCheckAPI] Updating existing radar: ${existingRadar.id}`);
          const updatedRadar = await prisma.scopeRadar.update({
            where: { id: existingRadar.id },
            data: {
              creepRisk: riskLevel === 'critical' ? 0.9 : 0.6,
              originalBudget,
              currentEstimate: invoiceTotal,
              budgetOverrun: overrunAmount,
              budgetOverrunPercent: overrunPercent,
              flaggedItems: invoices.slice(0, 5).map(inv => ({
                item: inv.invoiceNumber,
                amount: inv.items.reduce((s: number, i: any) => s + i.total, 0),
                date: inv.issuedDate.toISOString(),
              })),
              clientEmailDraft: aiResult.data.clientEmailDraft,
              recommendations: aiResult.data.recommendations,
              flaggedAt: new Date(), // Update timestamp
            },
          });
          scopeRadarId = updatedRadar.id;
          console.log(`[BudgetCheckAPI] Updated radar with latest budget data`);
        }

        // Send notification on every check (new or update)
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
                scopeRadarId
              }
            );
            console.log(`[BudgetCheckAPI] Notification sent for ${notificationType} (re-check)`);
          }
        } catch (notifError) {
          console.error('[BudgetCheckAPI] Failed to send notification:', notifError);
          // Don't fail the request if notification fails
        }
      }
    } else if (riskLevel !== 'safe') {
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
        amount: inv.items.reduce((s: number, i: any) => s + i.total, 0),
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

    // Prioritize projectId over clientId if both are provided
    // projectId is more specific and reliable
    let latestRadar;

    if (projectId) {
      console.log(`[BudgetCheckAPI] GET - Searching by projectId: ${projectId}`);

      latestRadar = await prisma.scopeRadar.findFirst({
        where: {
          projectId: projectId,
          budgetOverrun: {
            not: null,
          },
        },
        orderBy: {
          flaggedAt: 'desc',
        },
      });
    } else if (clientId) {
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
    }

    if (!latestRadar) {
      console.warn('[BudgetCheckAPI] GET - No budget data found');
      return NextResponse.json({
        error: 'No budget data found'
      }, { status: 404 });
    }

    console.log('[BudgetCheckAPI] GET - Found radar data:', latestRadar.id);

    // Fetch project to get currency
    let currency = 'INR'; // Default currency
    try {
      const project = await prisma.project.findUnique({
        where: { id: latestRadar.projectId },
      });
      if (project?.currency) {
        currency = project.currency;
      }
    } catch (error) {
      console.warn('[BudgetCheckAPI] GET - Could not fetch project currency:', error);
    }

    return NextResponse.json({
      success: true,
      radar: latestRadar,
      currency, // Include currency in response
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
