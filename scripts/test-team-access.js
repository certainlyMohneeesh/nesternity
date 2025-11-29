const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTeamAccess() {
  try {
    console.log('Testing team access...');
    
    // Get first team
    const team = await prisma.team.findFirst({
      include: {
        members: true
      }
    });
    
    if (!team) {
      console.log('No teams found');
      return;
    }
    
    console.log('Team:', team.id, team.name);
    console.log('Created by:', team.createdBy);
    console.log('Members:', team.members.map(m => ({ userId: m.userId, role: m.role })));
    
    // Get users
    const users = await prisma.user.findMany({
      take: 2
    });
    
    console.log('Users:', users.map(u => ({ id: u.id, email: u.email })));
    
    // Test team access for owner
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: team.id,
        userId: team.createdBy
      }
    });

    const teamOwner = await prisma.team.findFirst({
      where: {
        id: team.id,
        createdBy: team.createdBy
      }
    });
    
    console.log('Owner access check:');
    console.log('- Team member entry:', !!teamMember);
    console.log('- Team owner entry:', !!teamOwner);
    console.log('- Has access:', !!(teamMember || teamOwner));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTeamAccess();
