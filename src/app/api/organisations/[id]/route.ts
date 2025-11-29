import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/organisations/[id] - Get organisation details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    const organisation = await prisma.organisation.findUnique({
      where: {
        id
      },
      include: {
        projects: {
          include: {
            team: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                boards: true,
                issues: true,
                proposals: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (organisation.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ organisation });
  } catch (error) {
    console.error('Get organisation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organisation' },
      { status: 500 }
    );
  }
}

// PATCH /api/organisations/[id] - Update organisation
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
    const existing = await prisma.organisation.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    if (existing.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      budget,
      currency,
      status,
      notes,
      logoUrl,
      website,
      address,
      city,
      state,
      country,
      pincode
    } = body;

    const organisation = await prisma.organisation.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
        ...(currency && { currency }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
        ...(pincode !== undefined && { pincode })
      },
      include: {
        projects: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return NextResponse.json({
      organisation,
      message: 'Organisation updated successfully'
    });
  } catch (error) {
    console.error('Update organisation error:', error);
    return NextResponse.json(
      { error: 'Failed to update organisation' },
      { status: 500 }
    );
  }
}

// DELETE /api/organisations/[id] - Delete organisation
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
    const existing = await prisma.organisation.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    if (existing.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if organisation has projects
    if (existing._count.projects > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete organisation with existing projects',
          message: 'Please delete or reassign all projects before deleting this organisation.'
        },
        { status: 400 }
      );
    }

    // Delete organisation
    await prisma.organisation.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Organisation deleted successfully'
    });
  } catch (error) {
    console.error('Delete organisation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete organisation' },
      { status: 500 }
    );
  }
}
