import { prisma } from "@/lib/db";

/**
 * Check if a user has access to a project
 * Access is granted if the user is:
 * 1. The organisation owner
 * 2. A member of a team associated with the project
 */
export async function checkProjectAccess(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            organisation: {
                select: {
                    ownerId: true
                }
            },
            team: {
                include: {
                    members: {
                        where: {
                            userId: userId
                        }
                    }
                }
            }
        }
    });

    if (!project) {
        return { hasAccess: false, reason: 'Project not found' };
    }

    // Check if user is organisation owner
    if (project.organisation?.ownerId === userId) {
        return { hasAccess: true, role: 'owner', project };
    }

    // Check if user is a team member
    if (project.team.members.length > 0) {
        const member = project.team.members[0];
        return { hasAccess: true, role: member.role, project };
    }

    return { hasAccess: false, reason: 'No access' };
}

/**
 * Check if a user can access financial data (proposals, invoices, contracts)
 * Only organisation owners can access financial data
 */
export async function checkFinancialAccess(userId: string, organisationId: string) {
    const organisation = await prisma.organisation.findUnique({
        where: { id: organisationId },
        select: {
            ownerId: true
        }
    });

    if (!organisation) {
        return { hasAccess: false, reason: 'Organisation not found' };
    }

    const isOwner = organisation.ownerId === userId;

    return {
        hasAccess: isOwner,
        reason: isOwner ? null : 'Only organisation owners can access financial data'
    };
}

/**
 * Combined check for project and financial access
 * Used for pages like proposals, invoices, and contracts
 */
export async function checkProjectFinancialAccess(
    userId: string,
    projectId: string,
    organisationId: string
) {
    const projectAccess = await checkProjectAccess(userId, projectId);

    if (!projectAccess.hasAccess) {
        return projectAccess;
    }

    const financialAccess = await checkFinancialAccess(userId, organisationId);

    return {
        hasAccess: financialAccess.hasAccess,
        reason: financialAccess.reason,
        role: projectAccess.role,
        project: projectAccess.project
    };
}
