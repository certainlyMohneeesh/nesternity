/**
 * Verify Database Data
 * Run this to check if data exists in your database
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Load .env from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function verifyData() {
  try {
    console.log('🔍 Checking database for users and teams...\n');

    // Count users
    const userCount = await prisma.user.count();
    console.log(`✅ Total users in database: ${userCount}`);

    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log('\n📋 Recent users:');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.displayName}) - ID: ${user.id.substring(0, 8)}...`);
    });

    // Count teams
    const teamCount = await prisma.team.count();
    console.log(`\n✅ Total teams in database: ${teamCount}`);

    // List all teams
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log('\n📋 Recent teams:');
    teams.forEach(team => {
      console.log(`   - "${team.name}" by ${team.createdBy.substring(0, 8)}... - ID: ${team.id.substring(0, 8)}...`);
    });

    console.log('\n✅ Data verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
