import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ teamId: string }>
}

// Get specific team details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get team with members and check access
    const team = await db.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, email: true, displayName: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true, avatarUrl: true }
            }
          },
          orderBy: { acceptedAt: 'asc' }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
