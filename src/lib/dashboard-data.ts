import prisma from "@/lib/prisma";

// Aggregates all dashboard data for a user
export async function getDashboardData(userId: string) {
  console.log('=== getDashboardData DEBUG ===');
  console.log('Looking for user ID:', userId);
  
  // Fetch teams for the user (same logic as teams API)
  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { createdBy: userId },           // Teams user created (owner)
        { 
          members: { 
            some: { userId } 
          } 
        }                                // Teams user is member of
      ]
    },
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

  // Fetch recent tasks and completed tasks in parallel
  const [recentTasks, recentCompletedTasks] = await Promise.all([
    prisma.task.findMany({
      where: {
        board: { 
          team: { 
            OR: [
              { createdBy: userId },           // Teams user created (owner)
              { members: { some: { userId } } } // Teams user is member of
            ]
          } 
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
          team: { 
            OR: [
              { createdBy: userId },           // Teams user created (owner)
              { members: { some: { userId } } } // Teams user is member of
            ]
          } 
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

  // Stats
  const [totalBoards, totalTasks, completedTasks] = await Promise.all([
    prisma.board.count({ 
      where: { 
        team: { 
          OR: [
            { createdBy: userId },           // Teams user created (owner)
            { members: { some: { userId } } } // Teams user is member of
          ]
        } 
      } 
    }),
    prisma.task.count({ 
      where: { 
        board: { 
          team: { 
            OR: [
              { createdBy: userId },           // Teams user created (owner)
              { members: { some: { userId } } } // Teams user is member of
            ]
          } 
        } 
      } 
    }),
    prisma.task.count({ 
      where: { 
        board: { 
          team: { 
            OR: [
              { createdBy: userId },           // Teams user created (owner)
              { members: { some: { userId } } } // Teams user is member of
            ]
          } 
        }, 
        status: "DONE" 
      } 
    }),
  ]);

  return {
    teams,
    recentTasks,
    recentCompletedTasks,
    stats: {
      totalTeams: teams.length,
      totalBoards,
      totalTasks,
      activeTasks: totalTasks - completedTasks,
      completedTasks,
    },
  };
}
