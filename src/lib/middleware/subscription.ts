import { NextResponse } from 'next/server'
import { checkFeatureLimit } from '@/lib/subscription'
import type { FeatureType } from '@prisma/client'

export async function enforceFeatureLimit(userId: string, feature: FeatureType) {
  const result = await checkFeatureLimit(userId, feature)
  if (!result.allowed) {
    // Add helpful information for the caller
    return {
      allowed: false,
      reason: `Feature ${feature} limit exceeded`,
      used: result.used,
      limit: result.limit,
      remaining: result.remaining,
      warn: result.warn,
    }
  }
  return {
    allowed: true,
    used: result.used,
    limit: result.limit,
    remaining: result.remaining,
    warn: result.warn,
  }
}
