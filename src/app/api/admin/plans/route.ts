import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/middleware/admin-auth'
import { db } from '@/lib/db'

export async function GET() {
  const plans = await db.subscriptionPlan.findMany()
  return NextResponse.json({ plans })
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { razorpayPlanId, name, tier, amount } = body
  if (!razorpayPlanId || !name || typeof amount !== 'number') return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const plan = await db.subscriptionPlan.create({ data: { razorpayPlanId, name, tier, amount, maxOrganisations: 1, maxProjects: 1, maxTeamMembers: 1, maxAIProposals: 1, maxAIContracts: 1, maxRecurringInvoices: 1, maxInvoices: 10, maxStorage: BigInt(0), scopeRadarLevel: 'basic', analyticsLevel: 'basic', supportLevel: 'community' } })
  return NextResponse.json({ plan })
}
