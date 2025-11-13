#!/usr/bin/env node

/**
 * Delete Test Client Script
 * Removes the old architecture test client causing migration errors
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteTestClient() {
  console.log('🗑️  Deleting Test Client from Old Architecture\n');
  console.log('='.repeat(80));

  try {
    // First, find the client
    const client = await prisma.client.findFirst({
      where: {
        name: 'TEST CLIENT'
      },
      include: {
        projects: true
      }
    });

    if (!client) {
      console.log('❌ No client found with name "TEST CLIENT"');
      return;
    }

    console.log('\n📋 Found Client:');
    console.log(`   ID: ${client.id}`);
    console.log(`   Name: ${client.name}`);
    console.log(`   Email: ${client.email || 'N/A'}`);
    console.log(`   Projects: ${client.projects.length}`);

    if (client.projects.length > 0) {
      console.log('\n📦 Associated Projects:');
      client.projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} (ID: ${project.id})`);
      });
    }

    // Delete associated projects first
    if (client.projects.length > 0) {
      console.log('\n🗑️  Deleting associated projects...');
      const deletedProjects = await prisma.project.deleteMany({
        where: {
          clientId: client.id
        }
      });
      console.log(`   ✅ Deleted ${deletedProjects.count} project(s)`);
    }

    // Delete the client
    console.log('\n🗑️  Deleting client...');
    await prisma.client.delete({
      where: {
        id: client.id
      }
    });
    console.log('   ✅ Client deleted successfully');

    console.log('\n' + '='.repeat(80));
    console.log('✅ CLEANUP COMPLETE');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   - Deleted 1 client (TEST CLIENT)`);
    console.log(`   - Deleted ${client.projects.length} project(s)`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Run: npm run migrate:org:verbose');
    console.log('   2. Verify: Should show 0 clients and 0 projects');
    console.log('   3. Execute: npm run migrate:org:commit');

  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteTestClient()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
