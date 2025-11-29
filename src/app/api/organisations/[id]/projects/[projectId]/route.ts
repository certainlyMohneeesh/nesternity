import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/organisations/[id]/projects/[projectId]
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string; projectId: string }> }
) {
    try {
        const { id: orgId, projectId } = await context.params;
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organisationId: orgId,
            },
            include: {
                team: true,
                organisation: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check access: Org owner or Team member
        const isOrgOwner = project.organisation?.ownerId === user.id;
        const isTeamMember = await prisma.teamMember.findFirst({
            where: {
                teamId: project.teamId,
                userId: user.id,
            },
        });

        if (!isOrgOwner && !isTeamMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/organisations/[id]/projects/[projectId]
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string; projectId: string }> }
) {
    try {
        const { id: orgId, projectId } = await context.params;
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organisationId: orgId,
            },
            include: {
                organisation: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check access: Org owner or Team member (with appropriate role?)
        // For now, allow org owner or any team member to update
        const isOrgOwner = project.organisation?.ownerId === user.id;
        const isTeamMember = await prisma.teamMember.findFirst({
            where: {
                teamId: project.teamId,
                userId: user.id,
            },
        });

        if (!isOrgOwner && !isTeamMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, status, startDate, endDate, goal, budget, currency } = body;

        const updatedProject = await prisma.project.update({
            where: {
                id: projectId,
            },
            data: {
                name,
                description,
                status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                ...(goal !== undefined ? { goal: Number(goal) } : {}),
                ...(budget !== undefined ? { budget: Number(budget) } : {}),
                currency,
            } as any,
        });

        return NextResponse.json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/organisations/[id]/projects/[projectId]
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string; projectId: string }> }
) {
    try {
        const { id: orgId, projectId } = await context.params;
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organisationId: orgId,
            },
            include: {
                organisation: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Only org owner can delete? Or team owner?
        // Let's allow org owner or team owner
        const isOrgOwner = project.organisation?.ownerId === user.id;
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                teamId: project.teamId,
                userId: user.id,
            },
        });
        const isTeamOwner = teamMember?.role === 'owner';

        if (!isOrgOwner && !isTeamOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.project.delete({
            where: {
                id: projectId,
            },
        });

        return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
