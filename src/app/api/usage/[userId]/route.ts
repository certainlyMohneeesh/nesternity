import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/middleware/admin-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = params
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const usage = await db.usageRecord.findMany({
    where: { userId, periodStart, periodEnd },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ usage })
}
