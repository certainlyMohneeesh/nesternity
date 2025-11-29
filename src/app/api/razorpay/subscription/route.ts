import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sub = await prisma.razorpaySubscription.findFirst({ where: { userId: user.id } });
    if (!sub) return NextResponse.json({ success: true, subscription: null });

    return NextResponse.json({ success: true, subscription: sub });
  } catch (error) {
    console.error('Error fetching razorpay subscription', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
