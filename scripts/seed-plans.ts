import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const plans = [
    {
      razorpayPlanId: 'free-plan',
      name: 'FREE',
      tier: 'FREE',
      description: 'Generous Free tier for freelancers',
      amount: 0,
      currency: 'INR',
      period: 'monthly',
      interval: 1,
      maxOrganisations: 3,
      maxProjects: 10,
      maxTeamMembers: 10,
      maxAIProposals: 50,
      maxAIContracts: 5,
      maxRecurringInvoices: 5,
      maxInvoices: 200,
      maxStorage: BigInt(1 * 1024 * 1024 * 1024), // 1GB
      scopeRadarLevel: 'basic',
      analyticsLevel: 'basic',
      supportLevel: 'community',
      customBranding: false,
      apiAccess: false,
      whiteLabel: false,
    },
    {
      razorpayPlanId: 'starter-plan',
      name: 'STARTER',
      tier: 'STARTER',
      description: 'Affordable plan for growing freelancers',
      amount: 29900,
      currency: 'INR',
      period: 'monthly',
      interval: 1,
      maxOrganisations: 10,
      maxProjects: 50,
      maxTeamMembers: 25,
      maxAIProposals: 300,
      maxAIContracts: 50,
      maxRecurringInvoices: 20,
      maxInvoices: 1000,
      maxStorage: BigInt(10 * 1024 * 1024 * 1024), // 10GB
      scopeRadarLevel: 'standard',
      analyticsLevel: 'basic',
      supportLevel: 'email',
      customBranding: false,
      apiAccess: false,
      whiteLabel: false,
    }
  ]

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { razorpayPlanId: p.razorpayPlanId },
      create: p as any,
      update: p as any,
    })
  }

  console.log('Subscription plans seeded')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
