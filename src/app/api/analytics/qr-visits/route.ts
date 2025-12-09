import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const qrId = searchParams.get('qrId');
    const days = parseInt(searchParams.get('days') || '30');

    // Get user's payment settings to verify ownership
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { userId: user.id },
    });

    if (!paymentSettings) {
      return NextResponse.json(
        { error: 'Payment settings not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    const whereClause: any = {
      qr: {
        paymentSettingsId: paymentSettings.id,
      },
      visitedAt: {
        gte: startDate,
      },
    };

    if (qrId) {
      whereClause.qrId = qrId;
    }

    // Fetch all visits
    const visits = await prisma.qrVisit.findMany({
      where: whereClause,
      include: {
        qr: {
          select: {
            id: true,
            amount: true,
            note: true,
            invoiceId: true,
          },
        },
      },
      orderBy: {
        visitedAt: 'desc',
      },
    });

    // Calculate analytics
    const totalVisits = visits.length;
    const uniqueIps = new Set(visits.map((v) => v.ipAddress).filter(Boolean)).size;

    // Device breakdown
    const deviceBreakdown = visits.reduce(
      (acc, visit) => {
        const ua = visit.userAgent?.toLowerCase() || '';
        if (ua.includes('mobile')) acc.mobile++;
        else if (ua.includes('tablet')) acc.tablet++;
        else acc.desktop++;
        return acc;
      },
      { mobile: 0, tablet: 0, desktop: 0 }
    );

    // Location breakdown
    const locationBreakdown = visits.reduce((acc: any, visit) => {
      const country = visit.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    // Time series (visits per day)
    const visitsByDay = visits.reduce((acc: any, visit) => {
      const date = visit.visitedAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Top QR codes
    const qrBreakdown = visits.reduce((acc: any, visit) => {
      const qrId = visit.qrId;
      if (!acc[qrId]) {
        acc[qrId] = {
          qrId,
          visits: 0,
          amount: visit.qr.amount,
          note: visit.qr.note,
          invoiceId: visit.qr.invoiceId,
        };
      }
      acc[qrId].visits++;
      return acc;
    }, {});

    const topQrs = Object.values(qrBreakdown)
      .sort((a: any, b: any) => b.visits - a.visits)
      .slice(0, 10);

    // Browser breakdown
    const browserBreakdown = visits.reduce((acc: any, visit) => {
      const ua = visit.userAgent?.toLowerCase() || '';
      let browser = 'Other';
      if (ua.includes('chrome')) browser = 'Chrome';
      else if (ua.includes('firefox')) browser = 'Firefox';
      else if (ua.includes('safari')) browser = 'Safari';
      else if (ua.includes('edge')) browser = 'Edge';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    // Average visits per QR
    const uniqueQrs = new Set(visits.map((v) => v.qrId)).size;
    const avgVisitsPerQr = uniqueQrs > 0 ? totalVisits / uniqueQrs : 0;

    return NextResponse.json({
      success: true,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      summary: {
        totalVisits,
        uniqueIps,
        uniqueQrs,
        avgVisitsPerQr: Math.round(avgVisitsPerQr * 10) / 10,
      },
      deviceBreakdown,
      locationBreakdown,
      browserBreakdown,
      visitsByDay,
      topQrs,
      recentVisits: visits.slice(0, 50).map((v) => ({
        id: v.id,
        qrId: v.qrId,
        ipAddress: v.ipAddress,
        country: v.country,
        city: v.city,
        visitedAt: v.visitedAt,
        device: v.userAgent?.toLowerCase().includes('mobile')
          ? 'Mobile'
          : v.userAgent?.toLowerCase().includes('tablet')
          ? 'Tablet'
          : 'Desktop',
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
