import { prisma } from '@/lib/prisma';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionLimits {
  maxOrganisations: number; // -1 for unlimited
  maxProjectsPerOrg: number; // -1 for unlimited
  maxTeamMembers: number;
  maxStorageGB: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxOrganisations: 2,      // 1 own + 1 client
    maxProjectsPerOrg: 2,
    maxTeamMembers: 3,
    maxStorageGB: 1
  },
  pro: {
    maxOrganisations: 10,     // 1 own + 9 clients
    maxProjectsPerOrg: 20,
    maxTeamMembers: 25,
    maxStorageGB: 50
  },
  enterprise: {
    maxOrganisations: -1,     // Unlimited
    maxProjectsPerOrg: -1,    // Unlimited
    maxTeamMembers: -1,       // Unlimited
    maxStorageGB: -1          // Unlimited
  }
};

export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId }
  });

  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }

  // Determine tier based on stripe price ID
  if (subscription.stripePriceId.includes('enterprise')) {
    return 'enterprise';
  } else if (subscription.stripePriceId.includes('pro')) {
    return 'pro';
  }

  return 'free';
}

export async function getUserLimits(userId: string): Promise<SubscriptionLimits> {
  const tier = await getUserSubscriptionTier(userId);
  return SUBSCRIPTION_LIMITS[tier];
}

export async function checkOrganisationLimit(userId: string): Promise<{
  canCreate: boolean;
  current: number;
  limit: number;
  message?: string;
}> {
  const limits = await getUserLimits(userId);
  const current = await prisma.organisation.count({
    where: { ownerId: userId }
  });

  const canCreate = limits.maxOrganisations === -1 || current < limits.maxOrganisations;

  return {
    canCreate,
    current,
    limit: limits.maxOrganisations,
    message: canCreate 
      ? undefined 
      : `You have reached the maximum number of organisations (${limits.maxOrganisations}). Please upgrade your plan.`
  };
}

export async function checkProjectLimit(organisationId: string): Promise<{
  canCreate: boolean;
  current: number;
  limit: number;
  message?: string;
}> {
  const organisation = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: {
      _count: {
        select: {
          projects: true
        }
      }
    }
  });

  if (!organisation) {
    return {
      canCreate: false,
      current: 0,
      limit: 0,
      message: 'Organisation not found'
    };
  }

  const canCreate = organisation.maxProjects === -1 || organisation._count.projects < organisation.maxProjects;

  return {
    canCreate,
    current: organisation._count.projects,
    limit: organisation.maxProjects,
    message: canCreate
      ? undefined
      : `This organisation has reached the maximum number of projects (${organisation.maxProjects}).`
  };
}

export function getUpgradeMessage(currentTier: SubscriptionTier): string {
  if (currentTier === 'free') {
    return 'Upgrade to Pro to create up to 10 organisations and 20 projects per organisation.';
  } else if (currentTier === 'pro') {
    return 'Upgrade to Enterprise for unlimited organisations and projects.';
  }
  return '';
}
