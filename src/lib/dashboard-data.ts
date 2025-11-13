import { prisma } from "@/lib/db";

interface DashboardDataParams {
  userId: string;
  organisationId?: string;
  projectId?: string;
}

// Aggregates all dashboard data for a user (optionally filtered by org/project)
export async function getDashboardData({ userId, organisationId, projectId }: DashboardDataParams) {
  console.log('=== getDashboardData DEBUG ===');
  console.log('Looking for user ID:', userId);
  console.log('Organisation ID:', organisationId);
  console.log('Project ID:', projectId);
  
  // Build team filter based on parameters
  const teamWhere: any = {
    OR: [
      { createdBy: userId },           // Teams user created (owner)
      { 
        members: { 
          some: { userId } 
        } 
      }                                // Teams user is member of
    ]
  };

  // If projectId is provided, filter teams by project
  // Since Project belongs to Team (Project.teamId), we need to find the team of this project
  if (projectId) {
    // For a specific project, only show the team that owns this project
    teamWhere.AND = [
      { projects: { some: { id: projectId } } }
    ];
  } 
  // Otherwise, if organisationId is provided, filter teams by organisation
  else if (organisationId) {
    // For an organisation, show teams that have projects in this org
    teamWhere.AND = [
      { projects: { some: { organisationId } } }
    ];
  }

  console.log('Team filter:', JSON.stringify(teamWhere, null, 2));
  
  // Fetch teams for the user (filtered by org/project if provided)
  const teams = await prisma.team.findMany({
    where: teamWhere,
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: { members: true, boards: true },
      },
      boards: {
        select: { id: true, name: true },
      },
    },
  });
  
  console.log('Teams found:', teams.length);
  if (teams.length > 0) {
    console.log('Team names:', teams.map((t: any) => t.name));
  }
  console.log('===========================');

  // Extract team IDs for filtering tasks and boards
  const teamIds = teams.map(t => t.id);

  // Fetch recent tasks and completed tasks in parallel (filtered by teams)
  const [recentTasks, recentCompletedTasks] = await Promise.all([
    prisma.task.findMany({
      where: {
        board: { 
          teamId: teamIds.length > 0 ? { in: teamIds } : undefined
        },
        archived: false,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        status: true,
        archived: true,
        list: {
          select: {
            name: true,
            board: {
              select: {
                name: true,
                team: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        board: { 
          teamId: teamIds.length > 0 ? { in: teamIds } : undefined
        },
        status: "DONE",
      },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
        completedAt: true,
        list: {
          select: {
            name: true,
            board: {
              select: {
                name: true,
                team: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  // Stats (filtered by teams)
  const [totalBoards, totalTasks, completedTasks] = await Promise.all([
    prisma.board.count({ 
      where: { 
        teamId: teamIds.length > 0 ? { in: teamIds } : undefined
      } 
    }),
    prisma.task.count({ 
      where: { 
        board: { 
          teamId: teamIds.length > 0 ? { in: teamIds } : undefined
        } 
      } 
    }),
    prisma.task.count({ 
      where: { 
        board: { 
          teamId: teamIds.length > 0 ? { in: teamIds } : undefined
        }, 
        status: "DONE" 
      } 
    }),
  ]);

  // Fetch recurring invoices and clients
  const [recurringInvoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        issuedById: userId,
        isRecurring: true,
      },
      include: {
        items: {
          select: {
            total: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
      orderBy: {
        nextIssueDate: "asc",
      },
      take: 10,
    }),
    prisma.client.findMany({
      where: {
        createdBy: userId,
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get the most recent project for each client
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  return {
    teams,
    recentTasks,
    recentCompletedTasks,
    recurringInvoices,
    clients,
    stats: {
      totalTeams: teams.length,
      totalBoards,
      totalTasks,
      activeTasks: totalTasks - completedTasks,
      completedTasks,
    },
  };
}
