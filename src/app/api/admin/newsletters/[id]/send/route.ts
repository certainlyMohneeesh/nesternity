import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/server-auth';
import { Resend } from 'resend';

interface RouteParams {
    params: Promise<{ id: string }>
}

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// POST - Send newsletter to all active subscribers
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get newsletter
        const newsletter = await db.newsletter.findUnique({
            where: { id },
            include: {
                creator: true
            }
        });

        if (!newsletter) {
            return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
        }

        // Allow resending
        // if (newsletter.status === 'sent') {
        //     return NextResponse.json(
        //         { error: 'Newsletter has already been sent' },
        //         { status: 400 }
        //     );
        // }

        // Get all active subscribers
        const subscribers = await db.newsletterSubscriber.findMany({
            where: {
                status: 'active'
            }
        });

        if (subscribers.length === 0) {
            return NextResponse.json(
                { error: 'No active subscribers found' },
                { status: 400 }
            );
        }

        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not defined');
            return NextResponse.json(
                { error: 'Email service not configured (RESEND_API_KEY missing)' },
                { status: 500 }
            );
        }

        // Send emails using Resend directly
        const emailPromises = subscribers.map(async (subscriber) => {
            try {
                // Create unsubscribe link
                const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

                // Prepare HTML content with unsubscribe link
                const htmlWithUnsubscribe = `
          ${newsletter.htmlContent || newsletter.content}
          <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="text-align: center; color: #6b7280; font-size: 12px;">
            You're receiving this because you subscribed to Nesternity updates.<br />
            <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
          </p>
        `;

                // Send email via Resend
                const { data, error } = await resend.emails.send({
                    from: process.env.NEWSLETTER_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                    to: subscriber.email,
                    subject: newsletter.subject,
                    html: htmlWithUnsubscribe,
                    // text: newsletter.content // Optional: Add plain text version if needed
                });

                if (error) {
                    console.error(`Failed to send to ${subscriber.email}:`, error);
                    return { success: false, email: subscriber.email, error };
                }

                return { success: true, email: subscriber.email, id: data?.id };
            } catch (error) {
                console.error(`Error sending to ${subscriber.email}:`, error);
                return { success: false, email: subscriber.email, error };
            }
        });

        const results = await Promise.allSettled(emailPromises);
        const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
        const failed = results.length - successful;

        // Collect errors
        const errors = results
            .filter(r => r.status === 'fulfilled' && !(r.value as any).success)
            .map(r => (r as PromiseFulfilledResult<any>).value.error);

        // Update newsletter status
        await db.newsletter.update({
            where: { id },
            data: {
                status: 'sent',
                sentAt: new Date(),
                recipientCount: successful
            }
        });

        return NextResponse.json({
            message: 'Newsletter sent successfully',
            stats: {
                total: subscribers.length,
                successful,
                failed
            },
            errors // Return errors for debugging
        }, { status: 200 });

    } catch (error) {
        console.error('Newsletter send error:', error);
        return NextResponse.json(
            { error: 'Failed to send newsletter' },
            { status: 500 }
        );
    }
}
