import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/server-auth';

// GET - List all newsletters
export async function GET(request: NextRequest) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only allow admin users (you might want to add an isAdmin field to User model)
        // For now, checking if user exists

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');

        const where: any = {};
        if (status && (status === 'draft' || status === 'sent')) {
            where.status = status;
        }

        const newsletters = await db.newsletter.findMany({
            where,
            include: {
                creator: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ newsletters }, { status: 200 });
    } catch (error) {
        console.error('Error fetching newsletters:', error);
        return NextResponse.json({ error: 'Failed to fetch newsletters' }, { status: 500 });
    }
}

// POST - Create new newsletter (draft)
export async function POST(request: NextRequest) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subject, content, htmlContent } = await request.json();

        if (!subject || !content) {
            return NextResponse.json(
                { error: 'Subject and content are required' },
                { status: 400 }
            );
        }

        const newsletter = await db.newsletter.create({
            data: {
                subject,
                content,
                htmlContent,
                createdBy: user.id,
                status: 'draft'
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true
                    }
                }
            }
        });

        return NextResponse.json({ newsletter }, { status: 201 });
    } catch (error) {
        console.error('Error creating newsletter:', error);
        return NextResponse.json({ error: 'Failed to create newsletter' }, { status: 500 });
    }
}
