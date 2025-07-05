import prisma from "@/lib/prisma";

// Aggregates all dashboard data for a user
export async function getDashboardData(userId: string) {
  // Fetch teams for the user
  const teams = await prisma.team.findMany({
    where: {
      members: {
        some: { userId },
      },
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

  // Fetch recent tasks and completed tasks in parallel
  const [recentTasks, recentCompletedTasks] = await Promise.all([
    prisma.task.findMany({
      where: {
        board: { team: { members: { some: { userId } } } },
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
        board: { team: { members: { some: { userId } } } },
        archived: true,
        status: "DONE",
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
        updatedAt: true,
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
    prisma.board.count({ where: { team: { members: { some: { userId } } } } }),
    prisma.task.count({ where: { board: { team: { members: { some: { userId } } } } } }),
    prisma.task.count({ where: { board: { team: { members: { some: { userId } } } }, status: "DONE" } }),
  ]);

  return {
    teams,
    recentTasks,
    recentCompletedTasks: recentCompletedTasks.map(t => ({ ...t, completedAt: t.updatedAt })),
    stats: {
      totalTeams: teams.length,
      totalBoards,
      totalTasks,
      activeTasks: totalTasks - completedTasks,
      completedTasks,
    },
  };
}
