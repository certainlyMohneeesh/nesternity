import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/organisations/[id]/stats - Get organisation statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check ownership
    const organisation = await prisma.organisation.findUnique({
      where: { id: params.id }
    });

    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    if (organisation.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get project statistics
    const projects = await prisma.project.findMany({
      where: {
        organisationId: params.id
      },
      include: {
        _count: {
          select: {
            boards: true,
            issues: true,
            proposals: true
          }
        }
      }
    });

    const stats = {
      totalProjects: projects.length,
      projectsByStatus: {
        PLANNING: projects.filter(p => p.status === 'PLANNING').length,
        ACTIVE: projects.filter(p => p.status === 'ACTIVE').length,
        ON_HOLD: projects.filter(p => p.status === 'ON_HOLD').length,
        COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
        CANCELLED: projects.filter(p => p.status === 'CANCELLED').length
      },
      totalBoards: projects.reduce((sum, p) => sum + p._count.boards, 0),
      totalIssues: projects.reduce((sum, p) => sum + p._count.issues, 0),
      totalProposals: projects.reduce((sum, p) => sum + p._count.proposals, 0),
      limits: {
        maxProjects: organisation.maxProjects,
        currentProjects: projects.length,
        remainingProjects: organisation.maxProjects === -1 
          ? 'unlimited' 
          : organisation.maxProjects - projects.length
      }
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get organisation stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
