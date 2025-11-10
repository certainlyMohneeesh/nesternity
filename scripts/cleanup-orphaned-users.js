/**
 * Cleanup Orphaned Users Script
 * 
 * This script removes users from the Prisma database that no longer exist
 * in Supabase Authentication. Run this when you've deleted users from
 * Supabase Auth but they still exist in your app database.
 * 
 * Usage:
 *   node scripts/cleanup-orphaned-users.js
 */

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupOrphanedUsers() {
  try {
    console.log('🔍 Fetching all users from Prisma database...');
    
    // Get all users from Prisma
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
      }
    });

    console.log(`📊 Found ${dbUsers.length} users in database`);

    if (dbUsers.length === 0) {
      console.log('✅ No users to check');
      return;
    }

    console.log('🔍 Checking which users exist in Supabase Auth...');
    
    const orphanedUsers = [];
    const validUsers = [];

    // Check each user in batches
    for (const dbUser of dbUsers) {
      try {
        // Try to get user from Supabase Auth
        const { data, error } = await supabase.auth.admin.getUserById(dbUser.id);
        
        if (error || !data.user) {
          orphanedUsers.push(dbUser);
          console.log(`❌ Orphaned: ${dbUser.email} (${dbUser.id})`);
        } else {
          validUsers.push(dbUser);
          console.log(`✅ Valid: ${dbUser.email}`);
        }
      } catch (err) {
        // User doesn't exist in Supabase Auth
        orphanedUsers.push(dbUser);
        console.log(`❌ Orphaned: ${dbUser.email} (${dbUser.id})`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Valid users: ${validUsers.length}`);
    console.log(`   Orphaned users: ${orphanedUsers.length}`);

    if (orphanedUsers.length === 0) {
      console.log('\n✅ No orphaned users found!');
      return;
    }

    console.log('\n⚠️  The following users will be deleted from the database:');
    orphanedUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.id})`);
    });

    // Ask for confirmation (only in interactive mode)
    if (process.stdin.isTTY) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('\n⚠️  Delete these orphaned users? (yes/no): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled by user');
        return;
      }
    }

    // Delete orphaned users
    console.log('\n🗑️  Deleting orphaned users...');
    
    const userIds = orphanedUsers.map(u => u.id);
    
    // Delete related data first (cascade should handle this, but being explicit)
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds
        }
      }
    });

    console.log(`✅ Successfully deleted ${deleteResult.count} orphaned users`);
    console.log('✅ Database cleanup complete!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupOrphanedUsers()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
