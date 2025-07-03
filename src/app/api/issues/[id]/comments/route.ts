import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSafeUser } from '@/lib/safe-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSafeUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Verify user has access to the issue
    const issue = await prisma.issue.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdBy: user.id },
          { assignedTo: user.id },
        ],
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const comment = await prisma.issueComment.create({
      data: {
        issueId: params.id,
        userId: user.id,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
