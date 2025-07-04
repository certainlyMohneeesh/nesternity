import { prisma } from '@/lib/db';

/**
 * Check if a user has access to a team (either as a member or owner)
 */
export async function checkTeamAccess(teamId: string, userId: string): Promise<boolean> {
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId
    }
  });

  const teamOwner = await prisma.team.findFirst({
    where: {
      id: teamId,
      createdBy: userId
    }
  });

  return !!(teamMember || teamOwner);
}

/**
 * Check if a user has admin access to a team (admin member or owner)
 */
export async function checkTeamAdminAccess(teamId: string, userId: string): Promise<boolean> {
  const adminMember = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: 'admin'
    }
  });

  const teamOwner = await prisma.team.findFirst({
    where: {
      id: teamId,
      createdBy: userId
    }
  });

  return !!(adminMember || teamOwner);
}
