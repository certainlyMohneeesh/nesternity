import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/server-auth';

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Get newsletter details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const newsletter = await db.newsletter.findUnique({
            where: { id },
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

        if (!newsletter) {
            return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
        }

        return NextResponse.json({ newsletter }, { status: 200 });
    } catch (error) {
        console.error('Error fetching newsletter:', error);
        return NextResponse.json({ error: 'Failed to fetch newsletter' }, { status: 500 });
    }
}

// PUT - Update newsletter
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { subject, content, htmlContent } = await request.json();

        // Check if newsletter exists and is a draft
        const existing = await db.newsletter.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
        }

        if (existing.status === 'sent') {
            return NextResponse.json(
                { error: 'Cannot edit a sent newsletter' },
                { status: 400 }
            );
        }

        const newsletter = await db.newsletter.update({
            where: { id },
            data: {
                subject: subject || existing.subject,
                content: content || existing.content,
                htmlContent: htmlContent !== undefined ? htmlContent : existing.htmlContent
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

        return NextResponse.json({ newsletter }, { status: 200 });
    } catch (error) {
        console.error('Error updating newsletter:', error);
        return NextResponse.json({ error: 'Failed to update newsletter' }, { status: 500 });
    }
}

// DELETE - Delete newsletter
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if newsletter exists
        const existing = await db.newsletter.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
        }

        // Only allow deleting drafts
        if (existing.status === 'sent') {
            return NextResponse.json(
                { error: 'Cannot delete a sent newsletter' },
                { status: 400 }
            );
        }

        await db.newsletter.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Newsletter deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting newsletter:', error);
        return NextResponse.json({ error: 'Failed to delete newsletter' }, { status: 500 });
    }
}
