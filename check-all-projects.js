const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = '36661deb-c5d1-4d65-a6a4-e4413b6e19fc';
  
  console.log('🔍 Checking all project access methods...\n');
  
  // Method 1: Projects from user's clients
  const clientProjects = await prisma.project.findMany({
    where: {
      client: {
        createdBy: userId,
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      clientId: true,
      teamId: true,
    },
  });
  
  console.log('📁 Projects from user\'s clients:', JSON.stringify(clientProjects, null, 2));
  
  // Method 2: All projects (to see what exists)
  const allProjects = await prisma.project.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      status: true,
      teamId: true,
    },
  });
  
  console.log('\n📊 All projects in database (first 10):', JSON.stringify(allProjects, null, 2));
  
  // Check teams
  const allTeams = await prisma.team.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
    },
  });
  
  console.log('\n👥 All teams in database (first 10):', JSON.stringify(allTeams, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
