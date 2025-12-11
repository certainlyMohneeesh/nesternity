import { PrismaClient } from '../src/generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import crypto from 'node:crypto'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL not set')
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function setPlan(userId: string, planTier: string) {
  const plan = await prisma.subscriptionPlan.findFirst({ where: { tier: planTier as any } })
  if (!plan) throw new Error('Plan not found')

  // Check if user already has a Dodo customer
  let customer = await prisma.dodoCustomer.findUnique({ where: { userId } })
  if (!customer) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    
    customer = await prisma.dodoCustomer.create({
      data: {
        id: `dc_${crypto.randomUUID()}`,
        userId,
        dodoCustomerId: `manual-customer-${crypto.randomUUID()}`,
        email: user.email,
        name: user.displayName,
      },
    })
  }

  await prisma.dodoSubscription.create({
    data: {
      id: `ds_${crypto.randomUUID()}`,
      userId,
      customerId: customer.id,
      dodoSubscriptionId: `manual-${crypto.randomUUID()}`,
      dodoProductId: plan.dodoProductId,
      status: 'ACTIVE',
      planTier: plan.tier,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  })

  console.log(`Plan ${planTier} assigned to user ${userId}`)
}

if (process.argv.length < 4) {
  console.error('Usage: bun scripts/set-plan.ts <userId> <planTier>')
  console.error('Example: bun scripts/set-plan.ts user-123 FREE')
  process.exit(1)
}

setPlan(process.argv[2], process.argv[3]).catch(e => { console.error(e); process.exit(1) }).finally(async () => await prisma.$disconnect())
