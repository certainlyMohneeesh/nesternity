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
  // Build invoice filter based on project/org parameters
  const invoiceWhere: any = {
    issuedById: userId,
    isRecurring: true,
  };

  // Filter by projectId if provided
  if (projectId) {
    invoiceWhere.projectId = projectId;
  } 
  // Otherwise filter by organisationId if provided
  else if (organisationId) {
    invoiceWhere.organisationId = organisationId;
  }

  // Build client filter based on project/org parameters
  const clientWhere: any = {
    createdBy: userId,
  };

  // For organisation-level filtering only (not project)
  // For project-level, we'll fetch the project's client separately
  if (!projectId && organisationId) {
    clientWhere.organisationId = organisationId;
  }

  // Define the client shape that the dashboard expects
  const clientSelect = {
    id: true,
    name: true,
    email: true,
    company: true,
    budget: true,
    projects: {
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
      take: 1,
    },
  };

  // Fetch recurring invoices, clients, project details, and project invoices in parallel
  const [recurringInvoices, generalClients, projectDetails, projectInvoiceClient] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceWhere,
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
    // Fetch general clients (for org-level or when no project specified)
    prisma.client.findMany({
      where: clientWhere,
      select: clientSelect,
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    // If projectId is provided, fetch the project with its linked client
    projectId
      ? prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            clientId: true,
            client: {
              select: clientSelect,
            },
          },
        })
      : null,
    // If projectId is provided, also check if there are any invoices for this project
    // and get the client from those invoices (for ScopeRadarWidget)
    projectId
      ? prisma.invoice.findFirst({
          where: {
            projectId: projectId,
          },
          select: {
            client: {
              select: clientSelect,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      : null,
  ]);

  // Determine clients to return:
  // Priority for project dashboard:
  // 1. Project's directly linked client (Project.clientId)
  // 2. Client from any invoice belonging to this project
  // 3. Empty (no client available)
  let clients: typeof generalClients = [];
  
  if (projectId) {
    if (projectDetails?.client) {
      // Project has a directly linked client
      clients = [projectDetails.client];
    } else if (projectInvoiceClient?.client) {
      // Project has invoices with a client - use that client for ScopeRadarWidget
      clients = [projectInvoiceClient.client];
    }
    // If neither, clients stays empty
  } else {
    // No project specified - use general clients
    clients = generalClients;
  }

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
