import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/server-auth';

// GET - List all subscribers
export async function GET(request: NextRequest) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');

        const where: any = {};
        if (status && (status === 'active' || status === 'unsubscribed')) {
            where.status = status;
        }

        const subscribers = await db.newsletterSubscriber.findMany({
            where,
            orderBy: {
                subscribedAt: 'desc'
            }
        });

        const stats = {
            total: subscribers.length,
            active: subscribers.filter(s => s.status === 'active').length,
            unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length
        };

        return NextResponse.json({ subscribers, stats }, { status: 200 });
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }
}

// POST - Add subscriber manually
export async function POST(request: NextRequest) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Check if already exists
        const existing = await db.newsletterSubscriber.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 409 }
            );
        }

        const subscriber = await db.newsletterSubscriber.create({
            data: {
                email: email.toLowerCase(),
                status: 'active'
            }
        });

        return NextResponse.json({ subscriber }, { status: 201 });
    } catch (error) {
        console.error('Error adding subscriber:', error);
        return NextResponse.json({ error: 'Failed to add subscriber' }, { status: 500 });
    }
}

// DELETE - Remove subscriber
export async function DELETE(request: NextRequest) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await db.newsletterSubscriber.delete({
            where: { email: email.toLowerCase() }
        });

        return NextResponse.json({ message: 'Subscriber removed successfully' }, { status: 200 });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
        }
        console.error('Error removing subscriber:', error);
        return NextResponse.json({ error: 'Failed to remove subscriber' }, { status: 500 });
    }
}
