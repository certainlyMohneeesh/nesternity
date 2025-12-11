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

async function main() {
  const freePlan = await prisma.subscriptionPlan.findFirst({ where: { tier: 'FREE' } })
  if (!freePlan) throw new Error('Free plan missing')

  const users = await prisma.user.findMany({})
  let backfilled = 0

  for (const u of users) {
    // Check if user already has any subscription
    const existing = await prisma.dodoSubscription.findFirst({ where: { userId: u.id } })
    if (existing) continue

    // Create or get Dodo customer
    let customer = await prisma.dodoCustomer.findUnique({ where: { userId: u.id } })
    if (!customer) {
      customer = await prisma.dodoCustomer.create({
        data: {
          id: `dc_${crypto.randomUUID()}`,
          userId: u.id,
          dodoCustomerId: `manual-customer-${crypto.randomUUID()}`,
          email: u.email,
          name: u.name,
        },
      })
    }

    // Create free subscription
    await prisma.dodoSubscription.create({
      data: {
        id: `ds_${crypto.randomUUID()}`,
        userId: u.id,
        customerId: customer.id,
        dodoSubscriptionId: `manual-${crypto.randomUUID()}-${u.id}`,
        dodoProductId: freePlan.dodoProductId,
        status: 'TRIALING',
        planTier: 'FREE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      }
    })
    backfilled++
  }

  console.log(`Backfilled ${backfilled} users to FREE trial subscriptions`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => await prisma.$disconnect())
