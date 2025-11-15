import { prisma } from '@/lib/db'
import { FEATURE_LIMITS } from './feature-limits'
import type { FeatureType } from '@prisma/client'

interface CheckResult {
  allowed: boolean
  used: number
  limit: number | -1
  remaining: number | null
  warn: boolean
}

export async function getSubscriptionForUser(userId: string) {
  // Try to find an active RazorpaySubscription for user
  const sub = await prisma.razorpaySubscription.findFirst({
    where: { userId },
  })
  return sub
}

export async function checkFeatureLimit(userId: string, feature: FeatureType): Promise<CheckResult> {
  // Fetch subscription and plan
  const sub = await getSubscriptionForUser(userId)
  // Default to FREE if not found
  const planTier = sub?.planTier || 'FREE'

  // Determine limit from FEATURE_LIMITS
  // Note: feature is an enum like 'AI_PROPOSAL'
  const tierKey = planTier as keyof typeof FEATURE_LIMITS
  const limitValue = (FEATURE_LIMITS as any)[tierKey]?.[feature]

  // If feature limit is -1 => unlimited
  if (limitValue === -1) {
    return { allowed: true, used: 0, limit: -1, remaining: null, warn: false }
  }

  // compute used count for current period (month)
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const usage = await prisma.usageRecord.aggregate({
    _sum: { count: true },
    where: {
      userId,
      featureType: feature,
      periodStart: periodStart,
      periodEnd: periodEnd,
    }
  })

  const used = usage._sum.count || 0
  const remaining = Math.max(0, (limitValue || 0) - used)
  const warn = limitValue > 0 && used >= Math.floor(limitValue * 0.8)
  const allowed = limitValue > 0 ? used < limitValue : true

  return { allowed, used, limit: limitValue, remaining, warn }
}
