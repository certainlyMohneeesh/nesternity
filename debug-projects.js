const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = '36661deb-c5d1-4d65-a6a4-e4413b6e19fc'; // Your user ID from logs
  
  console.log('🔍 Debugging project fetch...\n');
  
  // Check team memberships
  const teamMemberships = await prisma.teamMember.findMany({
    where: { userId },
    select: {
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  console.log('👥 Team Memberships:', JSON.stringify(teamMemberships, null, 2));
  
  // Check all projects in those teams
  const teamIds = teamMemberships.map(m => m.teamId);
  
  const projects = await prisma.project.findMany({
    where: {
      teamId: {
        in: teamIds,
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      teamId: true,
      createdAt: true,
    },
  });
  
  console.log('\n📁 Projects in user teams:', JSON.stringify(projects, null, 2));
  
  // Check the nested query
  const userTeamMemberships = await prisma.teamMember.findMany({
    where: { userId },
    select: {
      team: {
        select: {
          projects: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
    },
  });
  
  const flatProjects = userTeamMemberships.flatMap(membership => 
    membership.team.projects
  ).slice(0, 20);
  
  console.log('\n📊 Flattened projects:', JSON.stringify(flatProjects, null, 2));
  console.log('\n✅ Total projects found:', flatProjects.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
