import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function setPlan(userId: string, razorpayPlanId: string) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { razorpayPlanId } })
  if (!plan) throw new Error('Plan not found')

    await prisma.razorpaySubscription.create({
    data: {
      userId,
        customerId: '',
      razorpaySubscriptionId: `manual-${Date.now()}`,
      razorpayPlanId: plan.razorpayPlanId,
      status: 'ACTIVE',
      planTier: plan.tier,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      totalCount: 0,
    },
  })

  console.log(`Plan ${razorpayPlanId} assigned to user ${userId}`)
}

if (process.argv.length < 4) {
  console.error('Usage: ts-node scripts/set-plan.ts <userId> <razorpayPlanId>')
  process.exit(1)
}

setPlan(process.argv[2], process.argv[3]).catch(e => { console.error(e); process.exit(1) }).finally(async () => await prisma.$disconnect())
