import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const freePlan = await prisma.subscriptionPlan.findUnique({ where: { razorpayPlanId: 'free-plan' } })
  if (!freePlan) throw new Error('Free plan missing')

  const users = await prisma.user.findMany({})

  for (const u of users) {
    const existing = await prisma.razorpaySubscription.findFirst({ where: { userId: u.id } })
    if (existing) continue

    await prisma.razorpaySubscription.create({
      data: {
        userId: u.id,
        customerId: '',
        razorpaySubscriptionId: `manual-${Date.now()}-${u.id}`,
        razorpayPlanId: freePlan.razorpayPlanId,
        status: 'TRIALING',
        planTier: 'FREE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        totalCount: 0,
      }
    })
  }

  console.log('Backfilled users to FREE trial subscriptions')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => await prisma.$disconnect())
