#!/usr/bin/env node

/**
 * COMPREHENSIVE DATA SYNCER & INTEGRITY MANAGER
 * 
 * This script provides comprehensive data synchronization and management:
 * 1. Syncs users from Supabase Auth to Prisma User table
 * 2. Validates and fixes all entity relationships in Prisma
 * 3. Ensures data integrity across teams, boards, tasks, projects, clients, invoices
 * 4. Handles orphaned records and missing references
 * 5. Provides data migration and cleanup utilities
 * 6. Ensures all team owners are also team members
 * 7. Comprehensive relationship validation and repair
 * 
 * Architecture:
 * - Supabase: Authentication only (users)
 * - Prisma + PostgreSQL: All application data
 * 
 * Usage:
 *   node sync-users.js [options]
 * 
 * Options:
 *   --dry-run: Show what would be done without making changes
 *   --verbose: Show detailed logging
 *   --fix-data: Fix data integrity issues automatically
 *   --validate-only: Only validate data, don't sync users
 *   --sync-all: Comprehensive sync including all relationship fixes
 *   --cleanup: Remove all orphaned and invalid data
 *   --repair-teams: Ensure all team owners are team members
 *   --batch-size=N: Set batch size for operations (default: 100)
 */

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Read .env file
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');

    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').replace(/"/g, '');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
} catch (error) {
  console.log('Warning: Could not load .env file:', error.message);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose') || isDryRun;
const fixData = args.includes('--fix-data');
const validateOnly = args.includes('--validate-only');
const syncAll = args.includes('--sync-all');
const cleanup = args.includes('--cleanup');
const repairTeams = args.includes('--repair-teams');

// Extract batch size from arguments
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) || 100 : 100;

// Initialize clients
const prisma = new PrismaClient();

// Create Supabase admin client with service role key
function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Logging utilities
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = isDryRun ? '[DRY RUN] ' : '';
  console.log(`${timestamp} [${level.toUpperCase()}] ${prefix}${message}`);
}

function verbose(message) {
  if (isVerbose) {
    log(message, 'debug');
  }
}

function error(message, err = null) {
  log(message, 'error');
  if (err && isVerbose) {
    console.error(err);
  }
}

// Main sync function
async function syncUsers() {
  log('Starting user sync process...');

  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createSupabaseAdminClient();

    // Step 1: Fetch all users from Supabase Auth
    log('Fetching users from Supabase Auth...');

    let allSupabaseUsers = [];
    let page = 1;
    const perPage = 1000; // Supabase admin API default limit

    while (true) {
      verbose(`Fetching page ${page} of Supabase users...`);

      const { data, error: fetchError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage
      });

      if (fetchError) {
        throw new Error(`Failed to fetch users from Supabase: ${fetchError.message}`);
      }

      // Extract users array from the response data
      const users = data?.users || [];
      verbose(`Found ${users.length} users on page ${page}`);

      if (users.length === 0) {
        break; // No more users
      }

      allSupabaseUsers = allSupabaseUsers.concat(users);

      // Check if this is the last page based on response metadata
      if (data?.nextPage === null || users.length < perPage) {
        break;
      }

      page++;
    }

    log(`Found ${allSupabaseUsers.length} total users in Supabase Auth`);

    // Step 2: Fetch all existing users from Prisma
    log('Fetching existing users from Prisma database...');

    const existingPrismaUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        stripeCustomerId: true,
        updatedAt: true
      }
    });

    log(`Found ${existingPrismaUsers.length} existing users in Prisma database`);

    // Step 3: Create lookup map for existing users
    const existingUserIds = new Set(existingPrismaUsers.map(user => user.id));
    const existingUserEmails = new Map(existingPrismaUsers.map(user => [user.email, user]));

    // Step 4: Identify users to create and update
    const usersToCreate = [];
    const usersToUpdate = [];
    const skippedUsers = [];

    for (const supabaseUser of allSupabaseUsers) {
      const { id, email, user_metadata = {}, created_at } = supabaseUser;

      // Skip users without email (shouldn't happen in normal cases)
      if (!email) {
        skippedUsers.push({ id, reason: 'No email address' });
        continue;
      }

      // Extract display name and avatar from metadata
      const displayName = user_metadata.full_name || user_metadata.name || user_metadata.display_name || null;
      const avatarUrl = user_metadata.avatar_url || user_metadata.picture || null;

      // Note: stripeCustomerId is application-managed, not synced from Supabase Auth
      // It will be set separately when user subscribes

      const userData = {
        id,
        email,
        displayName,
        avatarUrl,
        createdAt: new Date(created_at)
        // stripeCustomerId is intentionally not included - it's managed by the app
      };

      if (!existingUserIds.has(id)) {
        // User doesn't exist in Prisma, needs to be created
        usersToCreate.push(userData);
      } else {
        // User exists, check if update is needed
        const existingUser = existingUserEmails.get(email);
        if (existingUser) {
          // Check if any fields need updating
          const needsUpdate =
            existingUser.displayName !== displayName ||
            existingUser.avatarUrl !== avatarUrl;

          if (needsUpdate) {
            usersToUpdate.push({
              id,
              data: {
                displayName,
                avatarUrl
              }
            });
          }
        }
      }
    }

    // Step 5: Report what will be done
    log(`Users to create: ${usersToCreate.length}`);
    log(`Users to update: ${usersToUpdate.length}`);
    log(`Users skipped: ${skippedUsers.length}`);

    if (skippedUsers.length > 0) {
      log('Skipped users:');
      skippedUsers.forEach(user => {
        log(`  - ${user.id}: ${user.reason}`);
      });
    }

    if (isDryRun) {
      log('DRY RUN: No changes will be made');

      if (isVerbose && usersToCreate.length > 0) {
        log('Users that would be created:');
        usersToCreate.slice(0, 5).forEach(user => {
          log(`  - ${user.email} (${user.id})`);
        });
        if (usersToCreate.length > 5) {
          log(`  ... and ${usersToCreate.length - 5} more`);
        }
      }

      if (isVerbose && usersToUpdate.length > 0) {
        log('Users that would be updated:');
        usersToUpdate.slice(0, 5).forEach(user => {
          log(`  - ${user.id}`);
        });
        if (usersToUpdate.length > 5) {
          log(`  ... and ${usersToUpdate.length - 5} more`);
        }
      }

      return;
    }

    // Step 6: Create new users in batches
    if (usersToCreate.length > 0) {
      log(`Creating ${usersToCreate.length} new users...`);

      const batchSize = 100;
      let created = 0;

      for (let i = 0; i < usersToCreate.length; i += batchSize) {
        const batch = usersToCreate.slice(i, i + batchSize);

        try {
          await prisma.user.createMany({
            data: batch,
            skipDuplicates: true // Safety net in case of race conditions
          });

          created += batch.length;
          verbose(`Created batch of ${batch.length} users (${created}/${usersToCreate.length} total)`);

        } catch (err) {
          error(`Failed to create batch of users starting at index ${i}:`, err);

          // Try to create users individually to identify problematic records
          for (const userData of batch) {
            try {
              await prisma.user.create({ data: userData });
              created++;
              verbose(`Successfully created user: ${userData.email}`);
            } catch (individualErr) {
              error(`Failed to create user ${userData.email} (${userData.id}):`, individualErr);
            }
          }
        }
      }

      log(`Successfully created ${created} users`);
    }

    // Step 7: Update existing users
    if (usersToUpdate.length > 0) {
      log(`Updating ${usersToUpdate.length} existing users...`);

      let updated = 0;

      for (const userUpdate of usersToUpdate) {
        try {
          await prisma.user.update({
            where: { id: userUpdate.id },
            data: userUpdate.data
          });

          updated++;
          verbose(`Updated user: ${userUpdate.id}`);

        } catch (err) {
          error(`Failed to update user ${userUpdate.id}:`, err);
        }
      }

      log(`Successfully updated ${updated} users`);
    }

    // Step 8: Final verification
    log('Performing final verification...');

    const finalUserCount = await prisma.user.count();
    log(`Final user count in Prisma: ${finalUserCount}`);

    // Check for any remaining missing users
    const stillMissingUsers = [];
    for (const supabaseUser of allSupabaseUsers) {
      if (supabaseUser.email) {
        const exists = await prisma.user.findUnique({
          where: { id: supabaseUser.id },
          select: { id: true }
        });

        if (!exists) {
          stillMissingUsers.push(supabaseUser);
        }
      }
    }

    if (stillMissingUsers.length > 0) {
      error(`WARNING: ${stillMissingUsers.length} users are still missing from Prisma after sync`);
      stillMissingUsers.forEach(user => {
        error(`  - Missing: ${user.email} (${user.id})`);
      });
    } else {
      log('✅ All Supabase users are now present in Prisma database');
    }

    log('User sync completed successfully!');

  } catch (err) {
    error('User sync failed:', err);
    process.exit(1);
  }
}

// Comprehensive data validation and integrity checking
async function validateDataIntegrity() {
  log('Starting comprehensive data integrity validation...');

  const issues = {
    orphanedTeams: [],
    orphanedBoards: [],
    orphanedTasks: [],
    orphanedProjects: [],
    orphanedClients: [],
    orphanedInvoices: [],
    orphanedTeamMembers: [],
    orphanedTaskComments: [],
    orphanedTaskAttachments: [],
    orphanedBoardLists: [],
    orphanedActivities: [],
    orphanedBoardActivities: [],
    orphanedTaskActivities: [],
    orphanedIssues: [],
    orphanedIssueComments: [],
    orphanedTeamInvites: [],
    orphanedInvoiceItems: [],
    missingTeamOwners: [],
    invalidTaskAssignments: [],
    invalidTeamMemberships: [],
    teamsWithoutOwnerMembership: [],
    invalidBoardCreators: [],
    invalidProjectTeams: [],
    duplicateTeamMembers: []
  };

  try {
    // 1. Check for orphaned teams (teams with non-existent owners)
    log('Checking for orphaned teams...');
    const userIds = await getUserIds();
    const orphanedTeams = await prisma.team.findMany({
      where: {
        createdBy: { notIn: userIds }
      },
      include: {
        _count: { select: { members: true, boards: true } }
      }
    });
    issues.orphanedTeams = orphanedTeams;
    if (orphanedTeams.length > 0) {
      log(`⚠️  Found ${orphanedTeams.length} orphaned teams`);
    }

    // 2. Check for teams where owner is not a member
    log('Checking for teams where owner is not a member...');
    const teamsWithoutOwnerMembership = await prisma.team.findMany({
      where: {
        AND: [
          { createdBy: { in: userIds } },
          {
            members: {
              none: {
                userId: { in: await prisma.team.findMany({ select: { createdBy: true } }).then(teams => teams.map(t => t.createdBy)) }
              }
            }
          }
        ]
      },
      include: {
        owner: { select: { id: true, email: true } },
        _count: { select: { members: true } }
      }
    });
    issues.teamsWithoutOwnerMembership = teamsWithoutOwnerMembership;
    if (teamsWithoutOwnerMembership.length > 0) {
      log(`⚠️  Found ${teamsWithoutOwnerMembership.length} teams where owner is not a member`);
    }

    // 3. Check for duplicate team members
    log('Checking for duplicate team members...');
    const duplicateTeamMembers = await prisma.$queryRaw`
      SELECT team_id, user_id, COUNT(*) as count
      FROM team_members 
      GROUP BY team_id, user_id 
      HAVING COUNT(*) > 1
    `;
    issues.duplicateTeamMembers = duplicateTeamMembers;
    if (duplicateTeamMembers.length > 0) {
      log(`⚠️  Found ${duplicateTeamMembers.length} duplicate team memberships`);
    }

    // 4. Check for orphaned boards (boards with non-existent teams or creators)
    log('Checking for orphaned boards...');
    const teamIds = await getTeamIds();
    const orphanedBoards = await prisma.board.findMany({
      where: {
        OR: [
          { teamId: { notIn: teamIds } },
          { createdBy: { notIn: userIds } }
        ]
      },
      include: {
        _count: { select: { tasks: true, lists: true } }
      }
    });
    issues.orphanedBoards = orphanedBoards;
    if (orphanedBoards.length > 0) {
      log(`⚠️  Found ${orphanedBoards.length} orphaned boards`);
    }

    // 5. Check for orphaned tasks (tasks with non-existent boards, lists, or users)
    log('Checking for orphaned tasks...');
    const boardIds = await getBoardIds();
    const listIds = await getListIds();
    const orphanedTasks = await prisma.task.findMany({
      where: {
        OR: [
          { boardId: { notIn: boardIds } },
          { listId: { notIn: listIds } },
          { createdBy: { notIn: userIds } }
        ]
      }
    });
    issues.orphanedTasks = orphanedTasks;
    if (orphanedTasks.length > 0) {
      log(`⚠️  Found ${orphanedTasks.length} orphaned tasks`);
    }

    // 6. Check for orphaned projects
    log('Checking for orphaned projects...');
    const orphanedProjects = await prisma.project.findMany({
      where: {
        teamId: { notIn: teamIds }
      }
    });
    issues.orphanedProjects = orphanedProjects;
    if (orphanedProjects.length > 0) {
      log(`⚠️  Found ${orphanedProjects.length} orphaned projects`);
    }

    // 7. Check for orphaned clients
    log('Checking for orphaned clients...');
    const orphanedClients = await prisma.client.findMany({
      where: {
        createdBy: { notIn: userIds }
      }
    });
    issues.orphanedClients = orphanedClients;
    if (orphanedClients.length > 0) {
      log(`⚠️  Found ${orphanedClients.length} orphaned clients`);
    }

    // 8. Check for orphaned invoices
    log('Checking for orphaned invoices...');
    const clientIds = await getClientIds();
    const orphanedInvoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { clientId: { notIn: clientIds } },
          { issuedById: { notIn: userIds } }
        ]
      }
    });
    issues.orphanedInvoices = orphanedInvoices;
    if (orphanedInvoices.length > 0) {
      log(`⚠️  Found ${orphanedInvoices.length} orphaned invoices`);
    }

    // 9. Check for orphaned team members
    log('Checking for orphaned team members...');
    const orphanedTeamMembers = await prisma.teamMember.findMany({
      where: {
        OR: [
          { teamId: { notIn: teamIds } },
          { userId: { notIn: userIds } }
        ]
      }
    });
    issues.orphanedTeamMembers = orphanedTeamMembers;
    if (orphanedTeamMembers.length > 0) {
      log(`⚠️  Found ${orphanedTeamMembers.length} orphaned team members`);
    }

    // 10. Check for invalid task assignments
    log('Checking for invalid task assignments...');
    const invalidTaskAssignments = await prisma.task.findMany({
      where: {
        assignedTo: {
          not: null,
          notIn: userIds
        }
      }
    });
    issues.invalidTaskAssignments = invalidTaskAssignments;
    if (invalidTaskAssignments.length > 0) {
      log(`⚠️  Found ${invalidTaskAssignments.length} tasks with invalid assignments`);
    }

    // 11. Check for orphaned board lists
    log('Checking for orphaned board lists...');
    const orphanedBoardLists = await prisma.boardList.findMany({
      where: {
        boardId: { notIn: boardIds }
      }
    });
    issues.orphanedBoardLists = orphanedBoardLists;
    if (orphanedBoardLists.length > 0) {
      log(`⚠️  Found ${orphanedBoardLists.length} orphaned board lists`);
    }

    // 12. Check for orphaned activities
    log('Checking for orphaned activities...');
    const orphanedActivities = await prisma.activity.findMany({
      where: {
        OR: [
          { teamId: { notIn: teamIds } },
          { userId: { notIn: userIds } }
        ]
      }
    });
    issues.orphanedActivities = orphanedActivities;
    if (orphanedActivities.length > 0) {
      log(`⚠️  Found ${orphanedActivities.length} orphaned activities`);
    }

    // 13. Check for orphaned board activities
    log('Checking for orphaned board activities...');
    const orphanedBoardActivities = await prisma.boardActivity.findMany({
      where: {
        OR: [
          { boardId: { notIn: boardIds } },
          { userId: { notIn: userIds } }
        ]
      }
    });
    issues.orphanedBoardActivities = orphanedBoardActivities;
    if (orphanedBoardActivities.length > 0) {
      log(`⚠️  Found ${orphanedBoardActivities.length} orphaned board activities`);
    }

    // 14. Check for orphaned task activities
    log('Checking for orphaned task activities...');
    const taskIds = await getTaskIds();
    const orphanedTaskActivities = await prisma.taskActivity.findMany({
      where: {
        OR: [
          { taskId: { notIn: taskIds } },
          { userId: { notIn: userIds } }
        ]
      }
    });
    issues.orphanedTaskActivities = orphanedTaskActivities;
    if (orphanedTaskActivities.length > 0) {
      log(`⚠️  Found ${orphanedTaskActivities.length} orphaned task activities`);
    }

    // 15. Check for orphaned task comments
    log('Checking for orphaned task comments...');
    const orphanedTaskComments = await prisma.taskComment.findMany({
      where: {
        OR: [
          { taskId: { notIn: taskIds } },
          { userId: { notIn: userIds } }
        ]
      }
    });
    issues.orphanedTaskComments = orphanedTaskComments;
    if (orphanedTaskComments.length > 0) {
      log(`⚠️  Found ${orphanedTaskComments.length} orphaned task comments`);
    }

    // 16. Check for orphaned task attachments
    log('Checking for orphaned task attachments...');
    const orphanedTaskAttachments = await prisma.taskAttachment.findMany({
      where: {
        OR: [
          { taskId: { notIn: taskIds } },
          { uploadedBy: { notIn: userIds } }
        ]
      }
    });
    issues.orphanedTaskAttachments = orphanedTaskAttachments;
    if (orphanedTaskAttachments.length > 0) {
      log(`⚠️  Found ${orphanedTaskAttachments.length} orphaned task attachments`);
    }

    // 17. Check for orphaned team invites
    log('Checking for orphaned team invites...');
    const orphanedTeamInvites = await prisma.teamInvite.findMany({
      where: {
        OR: [
          { teamId: { notIn: teamIds } },
          { invitedBy: { notIn: userIds } }
        ]
      }
    });
    issues.orphanedTeamInvites = orphanedTeamInvites;
    if (orphanedTeamInvites.length > 0) {
      log(`⚠️  Found ${orphanedTeamInvites.length} orphaned team invites`);
    }

    // 18. Check for orphaned issues
    log('Checking for orphaned issues...');
    const projectIds = await getProjectIds();
    const orphanedIssues = await prisma.issue.findMany({
      where: {
        OR: [
          { projectId: { not: null, notIn: projectIds } },
          { boardId: { not: null, notIn: boardIds } },
          { taskId: { not: null, notIn: taskIds } },
          { createdBy: { notIn: userIds } },
          { assignedTo: { not: null, notIn: userIds } }
        ]
      }
    });
    issues.orphanedIssues = orphanedIssues;
    if (orphanedIssues.length > 0) {
      log(`⚠️  Found ${orphanedIssues.length} orphaned issues`);
    }

    // 19. Check for orphaned invoice items
    log('Checking for orphaned invoice items...');
    const invoiceIds = await getInvoiceIds();
    const orphanedInvoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoiceId: { notIn: invoiceIds }
      }
    });
    issues.orphanedInvoiceItems = orphanedInvoiceItems;
    if (orphanedInvoiceItems.length > 0) {
      log(`⚠️  Found ${orphanedInvoiceItems.length} orphaned invoice items`);
    }

    return issues;

  } catch (err) {
    error('Data integrity validation failed:', err);
    throw err;
  }
}

// Helper function to get all valid user IDs
async function getUserIds() {
  const users = await prisma.user.findMany({
    select: { id: true }
  });
  return users.map(u => u.id);
}

// Helper function to get all valid team IDs
async function getTeamIds() {
  const teams = await prisma.team.findMany({
    select: { id: true }
  });
  return teams.map(t => t.id);
}

// Helper function to get all valid board IDs
async function getBoardIds() {
  const boards = await prisma.board.findMany({
    select: { id: true }
  });
  return boards.map(b => b.id);
}

// Helper function to get all valid list IDs
async function getListIds() {
  const lists = await prisma.boardList.findMany({
    select: { id: true }
  });
  return lists.map(l => l.id);
}

// Helper function to get all valid task IDs
async function getTaskIds() {
  const tasks = await prisma.task.findMany({
    select: { id: true }
  });
  return tasks.map(t => t.id);
}

// Helper function to get all valid project IDs
async function getProjectIds() {
  const projects = await prisma.project.findMany({
    select: { id: true }
  });
  return projects.map(p => p.id);
}

// Helper function to get all valid client IDs
async function getClientIds() {
  const clients = await prisma.client.findMany({
    select: { id: true }
  });
  return clients.map(c => c.id);
}

// Helper function to get all valid invoice IDs
async function getInvoiceIds() {
  const invoices = await prisma.invoice.findMany({
    select: { id: true }
  });
  return invoices.map(i => i.id);
}

// Fix data integrity issues
async function fixDataIntegrityIssues(issues) {
  log('Starting comprehensive data integrity fixes...');

  let fixCount = 0;

  try {
    // Fix 1: Ensure team owners are team members
    if (issues.teamsWithoutOwnerMembership.length > 0 && (fixData || syncAll || repairTeams || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Adding ${issues.teamsWithoutOwnerMembership.length} team owners as team members...`);

      if (!isDryRun) {
        for (const team of issues.teamsWithoutOwnerMembership) {
          try {
            await prisma.teamMember.create({
              data: {
                teamId: team.id,
                userId: team.createdBy,
                role: 'owner',
                addedBy: team.createdBy
              }
            });
            fixCount++;
            verbose(`Added team owner ${team.owner.email} as member of team ${team.id}`);
          } catch (err) {
            // Ignore if already exists
            if (!err.message.includes('Unique constraint')) {
              error(`Failed to add team owner as member for team ${team.id}:`, err);
            }
          }
        }
      } else {
        fixCount += issues.teamsWithoutOwnerMembership.length;
      }
    }

    // Fix 2: Remove duplicate team members
    if (issues.duplicateTeamMembers.length > 0 && (fixData || cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.duplicateTeamMembers.length} duplicate team memberships...`);

      if (!isDryRun) {
        for (const duplicate of issues.duplicateTeamMembers) {
          // Keep the first record, delete the rest
          const members = await prisma.teamMember.findMany({
            where: {
              teamId: duplicate.team_id,
              userId: duplicate.user_id
            },
            orderBy: { createdAt: 'asc' }
          });

          for (let i = 1; i < members.length; i++) {
            await prisma.teamMember.delete({ where: { id: members[i].id } });
            fixCount++;
          }
        }
      } else {
        fixCount += issues.duplicateTeamMembers.reduce((sum, dup) => sum + (dup.count - 1), 0);
      }
    }

    // Fix 3: Remove orphaned team members
    if (issues.orphanedTeamMembers.length > 0 && (fixData || cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedTeamMembers.length} orphaned team members...`);

      if (!isDryRun) {
        for (const member of issues.orphanedTeamMembers) {
          await prisma.teamMember.delete({ where: { id: member.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedTeamMembers.length;
      }
    }

    // Fix 4: Unassign invalid task assignments
    if (issues.invalidTaskAssignments.length > 0 && (fixData || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Fixing ${issues.invalidTaskAssignments.length} invalid task assignments...`);

      if (!isDryRun) {
        for (const task of issues.invalidTaskAssignments) {
          await prisma.task.update({
            where: { id: task.id },
            data: { assignedTo: null }
          });
          fixCount++;
        }
      } else {
        fixCount += issues.invalidTaskAssignments.length;
      }
    }

    // Fix 5: Remove orphaned board lists
    if (issues.orphanedBoardLists.length > 0 && (fixData || cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedBoardLists.length} orphaned board lists...`);

      if (!isDryRun) {
        for (const list of issues.orphanedBoardLists) {
          // First, delete all tasks in this list
          await prisma.task.deleteMany({ where: { listId: list.id } });
          // Then delete the list
          await prisma.boardList.delete({ where: { id: list.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedBoardLists.length;
      }
    }

    // Fix 6: Handle orphaned tasks by deleting them
    if (issues.orphanedTasks.length > 0 && (fixData || cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedTasks.length} orphaned tasks...`);

      if (!isDryRun) {
        for (const task of issues.orphanedTasks) {
          // Delete task comments and attachments first
          await prisma.taskComment.deleteMany({ where: { taskId: task.id } });
          await prisma.taskAttachment.deleteMany({ where: { taskId: task.id } });
          await prisma.taskActivity.deleteMany({ where: { taskId: task.id } });
          // Then delete the task
          await prisma.task.delete({ where: { id: task.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedTasks.length;
      }
    }

    // Fix 7: Remove orphaned activities
    if (issues.orphanedActivities.length > 0 && (cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedActivities.length} orphaned activities...`);

      if (!isDryRun) {
        for (const activity of issues.orphanedActivities) {
          await prisma.activity.delete({ where: { id: activity.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedActivities.length;
      }
    }

    // Fix 8: Remove orphaned board activities
    if (issues.orphanedBoardActivities.length > 0 && (cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedBoardActivities.length} orphaned board activities...`);

      if (!isDryRun) {
        for (const activity of issues.orphanedBoardActivities) {
          await prisma.boardActivity.delete({ where: { id: activity.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedBoardActivities.length;
      }
    }

    // Fix 9: Remove orphaned task activities
    if (issues.orphanedTaskActivities.length > 0 && (cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedTaskActivities.length} orphaned task activities...`);

      if (!isDryRun) {
        for (const activity of issues.orphanedTaskActivities) {
          await prisma.taskActivity.delete({ where: { id: activity.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedTaskActivities.length;
      }
    }

    // Fix 10: Remove orphaned task comments
    if (issues.orphanedTaskComments.length > 0 && (cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedTaskComments.length} orphaned task comments...`);

      if (!isDryRun) {
        for (const comment of issues.orphanedTaskComments) {
          await prisma.taskComment.delete({ where: { id: comment.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedTaskComments.length;
      }
    }

    // Fix 11: Remove orphaned task attachments
    if (issues.orphanedTaskAttachments.length > 0 && (cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedTaskAttachments.length} orphaned task attachments...`);

      if (!isDryRun) {
        for (const attachment of issues.orphanedTaskAttachments) {
          await prisma.taskAttachment.delete({ where: { id: attachment.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedTaskAttachments.length;
      }
    }

    // Fix 12: Remove orphaned team invites
    if (issues.orphanedTeamInvites.length > 0 && (cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedTeamInvites.length} orphaned team invites...`);

      if (!isDryRun) {
        for (const invite of issues.orphanedTeamInvites) {
          await prisma.teamInvite.delete({ where: { id: invite.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedTeamInvites.length;
      }
    }

    // Fix 13: Remove orphaned invoice items
    if (issues.orphanedInvoiceItems.length > 0 && (cleanup || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Removing ${issues.orphanedInvoiceItems.length} orphaned invoice items...`);

      if (!isDryRun) {
        for (const item of issues.orphanedInvoiceItems) {
          await prisma.invoiceItem.delete({ where: { id: item.id } });
          fixCount++;
        }
      } else {
        fixCount += issues.orphanedInvoiceItems.length;
      }
    }

    // Fix 14: Fix orphaned issues by nullifying invalid references
    if (issues.orphanedIssues.length > 0 && (fixData || isDryRun)) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Fixing ${issues.orphanedIssues.length} orphaned issues...`);

      if (!isDryRun) {
        for (const issue of issues.orphanedIssues) {
          const userIds = await getUserIds();
          const projectIds = await getProjectIds();
          const boardIds = await getBoardIds();
          const taskIds = await getTaskIds();

          const updateData = {};

          // Fix invalid references by nullifying them
          if (issue.projectId && !projectIds.includes(issue.projectId)) {
            updateData.projectId = null;
          }
          if (issue.boardId && !boardIds.includes(issue.boardId)) {
            updateData.boardId = null;
          }
          if (issue.taskId && !taskIds.includes(issue.taskId)) {
            updateData.taskId = null;
          }
          if (issue.assignedTo && !userIds.includes(issue.assignedTo)) {
            updateData.assignedTo = null;
          }

          // If the creator doesn't exist, we need to delete the issue
          if (!userIds.includes(issue.createdBy)) {
            await prisma.issueComment.deleteMany({ where: { issueId: issue.id } });
            await prisma.issue.delete({ where: { id: issue.id } });
          } else if (Object.keys(updateData).length > 0) {
            await prisma.issue.update({
              where: { id: issue.id },
              data: updateData
            });
          }

          fixCount++;
        }
      } else {
        fixCount += issues.orphanedIssues.length;
      }
    }

    // Note: We don't auto-delete orphaned teams, boards, projects, clients, or invoices
    // as these may contain valuable business data and should be handled manually

    if (fixCount > 0) {
      log(`${isDryRun ? '[DRY RUN] ' : ''}Fixed ${fixCount} data integrity issues`);
    }

    return fixCount;

  } catch (err) {
    error('Failed to fix data integrity issues:', err);
    throw err;
  }
}

// Generate comprehensive report
async function generateDataReport() {
  log('Generating comprehensive data report...');

  try {
    const stats = {
      users: await prisma.user.count(),
      teams: await prisma.team.count(),
      teamMembers: await prisma.teamMember.count(),
      teamInvites: await prisma.teamInvite.count(),
      boards: await prisma.board.count(),
      boardLists: await prisma.boardList.count(),
      tasks: await prisma.task.count(),
      projects: await prisma.project.count(),
      clients: await prisma.client.count(),
      invoices: await prisma.invoice.count(),
      invoiceItems: await prisma.invoiceItem.count(),
      activities: await prisma.activity.count(),
      boardActivities: await prisma.boardActivity.count(),
      taskActivities: await prisma.taskActivity.count(),
      taskComments: await prisma.taskComment.count(),
      taskAttachments: await prisma.taskAttachment.count(),
      issues: await prisma.issue.count(),
      issueComments: await prisma.issueComment.count(),
      subscriptions: await prisma.subscription.count()
    };

    log('📊 DATABASE STATISTICS:');
    log('   Core Entities:');
    log(`     Users: ${stats.users}`);
    log(`     Teams: ${stats.teams}`);
    log(`     Team Members: ${stats.teamMembers}`);
    log(`     Team Invites: ${stats.teamInvites}`);
    log(`     Boards: ${stats.boards}`);
    log(`     Board Lists: ${stats.boardLists}`);
    log(`     Tasks: ${stats.tasks}`);
    log('   Business Entities:');
    log(`     Projects: ${stats.projects}`);
    log(`     Clients: ${stats.clients}`);
    log(`     Invoices: ${stats.invoices}`);
    log(`     Invoice Items: ${stats.invoiceItems}`);
    log(`     Issues: ${stats.issues}`);
    log(`     Issue Comments: ${stats.issueComments}`);
    log('   Activity & Engagement:');
    log(`     Activities: ${stats.activities}`);
    log(`     Board Activities: ${stats.boardActivities}`);
    log(`     Task Activities: ${stats.taskActivities}`);
    log(`     Task Comments: ${stats.taskComments}`);
    log(`     Task Attachments: ${stats.taskAttachments}`);
    log('   Subscriptions:');
    log(`     Subscriptions: ${stats.subscriptions}`);

    // Get health metrics
    if (isVerbose) {
      log('🏥 HEALTH METRICS:');

      // Team metrics
      const teamsWithMembers = await prisma.team.count({
        where: { members: { some: {} } }
      });
      const teamUtilization = stats.teams > 0 ? ((teamsWithMembers / stats.teams) * 100).toFixed(1) : 0;
      log(`   Teams with members: ${teamsWithMembers}/${stats.teams} (${teamUtilization}%)`);

      // Board metrics
      const boardsWithTasks = await prisma.board.count({
        where: { tasks: { some: {} } }
      });
      const boardUtilization = stats.boards > 0 ? ((boardsWithTasks / stats.boards) * 100).toFixed(1) : 0;
      log(`   Boards with tasks: ${boardsWithTasks}/${stats.boards} (${boardUtilization}%)`);

      // Task metrics
      const completedTasks = await prisma.task.count({
        where: { status: 'DONE' }
      });
      const taskCompletion = stats.tasks > 0 ? ((completedTasks / stats.tasks) * 100).toFixed(1) : 0;
      log(`   Completed tasks: ${completedTasks}/${stats.tasks} (${taskCompletion}%)`);

      // Invoice metrics
      const paidInvoices = await prisma.invoice.count({
        where: { status: 'PAID' }
      });
      const invoicePayment = stats.invoices > 0 ? ((paidInvoices / stats.invoices) * 100).toFixed(1) : 0;
      log(`   Paid invoices: ${paidInvoices}/${stats.invoices} (${invoicePayment}%)`);
    }

    // Get recent activity
    const recentTeams = await prisma.team.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, createdAt: true, _count: { select: { members: true } } }
    });

    const recentTasks = await prisma.task.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { title: true, status: true, createdAt: true }
    });

    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true, status: true, createdAt: true }
    });

    if (isVerbose && (recentTeams.length > 0 || recentTasks.length > 0 || recentInvoices.length > 0)) {
      log('📅 RECENT ACTIVITY:');

      if (recentTeams.length > 0) {
        log('   Recent teams:');
        recentTeams.forEach(team => {
          log(`     - ${team.name} (${team._count.members} members) - ${team.createdAt.toLocaleDateString()}`);
        });
      }

      if (recentTasks.length > 0) {
        log('   Recent tasks:');
        recentTasks.forEach(task => {
          log(`     - ${task.title} [${task.status}] - ${task.createdAt.toLocaleDateString()}`);
        });
      }

      if (recentInvoices.length > 0) {
        log('   Recent invoices:');
        recentInvoices.forEach(invoice => {
          log(`     - ${invoice.invoiceNumber} [${invoice.status}] - ${invoice.createdAt.toLocaleDateString()}`);
        });
      }
    }

    return stats;

  } catch (err) {
    error('Failed to generate data report:', err);
    throw err;
  }
}

// Main execution
async function main() {
  try {
    log('🚀 Starting comprehensive data sync and validation...');

    // Parse and display options
    const activeOptions = [];
    if (isDryRun) activeOptions.push('dry-run');
    if (isVerbose) activeOptions.push('verbose');
    if (fixData) activeOptions.push('fix-data');
    if (validateOnly) activeOptions.push('validate-only');
    if (syncAll) activeOptions.push('sync-all');
    if (cleanup) activeOptions.push('cleanup');
    if (repairTeams) activeOptions.push('repair-teams');

    log(`Active options: ${activeOptions.length > 0 ? activeOptions.join(', ') : 'none'}`);
    log(`Batch size: ${batchSize}`);

    // Generate initial report
    await generateDataReport();

    // Step 1: Sync users from Supabase (unless validate-only mode)
    if (!validateOnly) {
      await syncUsers();
    } else {
      log('Skipping user sync (validate-only mode)');
    }

    // Step 2: Validate data integrity
    log('🔍 Validating data integrity...');
    const issues = await validateDataIntegrity();

    // Count total issues
    const totalIssues = Object.values(issues).reduce((sum, issueArray) => sum + issueArray.length, 0);

    if (totalIssues === 0) {
      log('✅ No data integrity issues found!');
    } else {
      log(`⚠️  Found ${totalIssues} data integrity issues across ${Object.keys(issues).filter(k => issues[k].length > 0).length} categories`);

      // Show summary of issues by category
      Object.entries(issues).forEach(([issueType, issueList]) => {
        if (issueList.length > 0) {
          log(`   ${issueType}: ${issueList.length} issues`);
        }
      });

      // Show detailed issues if verbose
      if (isVerbose) {
        log('📋 DETAILED ISSUES:');
        Object.entries(issues).forEach(([issueType, issueList]) => {
          if (issueList.length > 0) {
            log(`   ${issueType}:`);
            if (issueList.length <= 10) {
              issueList.forEach((item, index) => {
                const identifier = item.name || item.title || item.email || item.invoiceNumber || item.id;
                log(`     ${index + 1}. ${identifier}`);
              });
            } else {
              log(`     (showing first 10 of ${issueList.length})`);
              issueList.slice(0, 10).forEach((item, index) => {
                const identifier = item.name || item.title || item.email || item.invoiceNumber || item.id;
                log(`     ${index + 1}. ${identifier}`);
              });
            }
          }
        });
      }

      // Step 3: Fix issues if requested
      const shouldFix = fixData || syncAll || cleanup || repairTeams || isDryRun;
      if (shouldFix) {
        log('🔧 Attempting to fix data integrity issues...');
        const fixedCount = await fixDataIntegrityIssues(issues);

        if (fixedCount > 0) {
          log(`✅ ${isDryRun ? 'Would fix' : 'Fixed'} ${fixedCount} issues`);

          if (!isDryRun) {
            // Re-validate after fixes
            log('🔄 Re-validating after fixes...');
            const postFixIssues = await validateDataIntegrity();
            const remainingIssues = Object.values(postFixIssues).reduce((sum, issueArray) => sum + issueArray.length, 0);

            if (remainingIssues === 0) {
              log('✅ All fixable issues resolved!');
            } else if (remainingIssues < totalIssues) {
              log(`✅ Reduced issues from ${totalIssues} to ${remainingIssues} (${totalIssues - remainingIssues} fixed)`);
              log('⚠️  Remaining issues may require manual intervention');
            } else {
              log(`⚠️  ${remainingIssues} issues remain (may require manual intervention)`);
            }
          }
        } else {
          log('ℹ️  No automatically fixable issues found');
        }
      } else {
        log('ℹ️  Use --fix-data, --sync-all, --cleanup, or --repair-teams to automatically fix issues');
      }
    }

    // Special handling for specific operations
    if (repairTeams && !validateOnly) {
      log('🔧 Running team ownership repair...');
      const teamsNeedingRepair = issues.teamsWithoutOwnerMembership || [];
      if (teamsNeedingRepair.length > 0) {
        log(`Found ${teamsNeedingRepair.length} teams where owners are not members`);
      } else {
        log('✅ All team owners are already team members');
      }
    }

    if (cleanup && !validateOnly) {
      log('🧹 Running comprehensive cleanup...');
      const cleanupCategories = [
        'orphanedTeamMembers', 'orphanedBoardLists', 'orphanedTasks',
        'orphanedActivities', 'orphanedBoardActivities', 'orphanedTaskActivities',
        'orphanedTaskComments', 'orphanedTaskAttachments', 'orphanedTeamInvites',
        'orphanedInvoiceItems', 'duplicateTeamMembers'
      ];
      const cleanupCount = cleanupCategories.reduce((sum, category) => sum + (issues[category]?.length || 0), 0);
      if (cleanupCount > 0) {
        log(`Cleaned up ${cleanupCount} orphaned/duplicate records`);
      } else {
        log('✅ No orphaned records found to clean up');
      }
    }

    // Generate final report
    log('📊 Final database state:');
    await generateDataReport();

    // Summary
    if (isDryRun) {
      log('🎯 DRY RUN COMPLETE - No changes were made');
      log('   Run without --dry-run to apply changes');
    } else {
      log('🎉 Comprehensive sync and validation completed!');
    }

    // Exit with appropriate code
    if (totalIssues > 0 && !shouldFix && !isDryRun) {
      log('⚠️  Exiting with code 1 due to unresolved data integrity issues');
      log('   Use --fix-data, --sync-all, --cleanup, or --repair-teams to fix issues');
      process.exit(1);
    }

  } catch (err) {
    error('Fatal error during comprehensive sync:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { syncUsers };
