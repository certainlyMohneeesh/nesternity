import { prisma } from '@/lib/db'
import { FeatureType } from '@prisma/client'

export async function incrementUsage(userId: string, subscriptionId: string, featureType: FeatureType, count = 1, meta: Record<string, any> | null = null) {
  const now = new Date()
  // Monthly period - start at first day of month
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  return prisma.usageRecord.create({
    data: {
      userId,
      subscriptionId,
      featureType,
      count,
      periodStart,
      periodEnd,
    }
  })
}

export async function getUsageForPeriod(userId: string, featureType: FeatureType, periodStart: Date, periodEnd: Date) {
  const records = await prisma.usageRecord.findMany({
    where: {
      userId,
      featureType,
      periodStart: {
        gte: periodStart,
      },
      periodEnd: {
        lte: periodEnd,
      }
    }
  })

  const total = records.reduce((s, r) => s + r.count, 0)
  return { total, records }
}
