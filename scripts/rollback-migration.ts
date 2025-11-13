import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RollbackStats {
  projectsReverted: number;
  organisationsDeleted: number;
  errors: string[];
}

interface RollbackOptions {
  dryRun?: boolean;
  verbose?: boolean;
  deleteAutoCreated?: boolean;
}

/**
 * Rollback Script for Organisation Migration
 * 
 * WARNING: This will revert the migration changes. Use with caution!
 * 
 * This script will:
 * 1. Revert Project.organisationId back to null (keeping clientId intact)
 * 2. Optionally delete auto-created organisations
 * 3. Preserve manually created organisations
 */
async function rollbackMigration(options: RollbackOptions = {}) {
  const { dryRun = false, verbose = false, deleteAutoCreated = false } = options;

  console.log("\n⚠️  MIGRATION ROLLBACK");
  console.log("=".repeat(80));
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes will be saved)" : "PRODUCTION (changes will be committed)"}`);
  console.log(`Delete auto-created orgs: ${deleteAutoCreated ? "YES" : "NO"}`);
  console.log("=".repeat(80));

  const stats: RollbackStats = {
    projectsReverted: 0,
    organisationsDeleted: 0,
    errors: [],
  };

  try {
    // Step 1: Show current state
    console.log("\n📊 Current State:");
    await showCurrentState(verbose);

    // Step 2: Revert project organisation references
    console.log("\n🔄 Step 1: Reverting project organisation references...");
    await revertProjectReferences(stats, dryRun, verbose);

    // Step 3: Delete auto-created organisations (optional)
    if (deleteAutoCreated) {
      console.log("\n🗑️  Step 2: Deleting auto-created organisations...");
      await deleteAutoCreatedOrganisations(stats, dryRun, verbose);
    } else {
      console.log("\n⏭️  Step 2: Skipping organisation deletion (use --delete-orgs to enable)");
    }

    // Print summary
    printRollbackSummary(stats, dryRun);

    if (dryRun) {
      console.log("\n⚠️  This was a DRY RUN. No changes were committed to the database.");
      console.log("Run with --commit flag to apply rollback.");
    } else {
      console.log("\n✅ Rollback completed successfully!");
      console.log("⚠️  Your database has been reverted to the pre-migration state.");
    }

  } catch (error) {
    console.error("\n❌ Rollback failed:", error);
    stats.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

/**
 * Show current database state
 */
async function showCurrentState(verbose: boolean) {
  const totalProjects = await prisma.project.count();
  const projectsWithOrg = await prisma.project.count({
    where: { organisationId: { not: null } }
  });
  const projectsWithClient = await prisma.project.count({
    where: { clientId: { not: null } }
  });
  const totalOrgs = await prisma.organisation.count();
  const autoCreatedOrgs = await prisma.organisation.count({
    where: {
      notes: {
        contains: "Auto-created during migration"
      }
    }
  });

  console.log(`   Total Projects: ${totalProjects}`);
  console.log(`   Projects with organisationId: ${projectsWithOrg}`);
  console.log(`   Projects with clientId: ${projectsWithClient}`);
  console.log(`   Total Organisations: ${totalOrgs}`);
  console.log(`   Auto-created Organisations: ${autoCreatedOrgs}`);

  if (verbose) {
    const orgTypes = await prisma.organisation.groupBy({
      by: ["type"],
      _count: true
    });
    console.log(`   Organisations by type:`);
    orgTypes.forEach(({ type, _count }) => {
      console.log(`      ${type}: ${_count}`);
    });
  }
}

/**
 * Step 1: Revert project organisation references
 */
async function revertProjectReferences(
  stats: RollbackStats,
  dryRun: boolean,
  verbose: boolean
) {
  // Find all projects that have organisationId set
  const projects = await prisma.project.findMany({
    where: {
      organisationId: { not: null }
    },
    select: {
      id: true,
      name: true,
      organisationId: true,
      clientId: true,
      organisation: {
        select: {
          name: true,
          type: true,
        }
      }
    }
  });

  console.log(`   Found ${projects.length} projects with organisationId to revert`);

  for (const project of projects) {
    try {
      if (verbose) {
        console.log(`   Reverting: ${project.name} (Org: ${project.organisation?.name || "Unknown"})`);
      }

      // Verify the project has a clientId to fall back to
      if (!project.clientId) {
        const warning = `Project ${project.name} has no clientId to revert to`;
        console.log(`   ⚠️  ${warning}`);
        stats.errors.push(warning);
        continue;
      }

      if (!dryRun) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            organisationId: null,
            // clientId remains intact
          }
        });
      }

      stats.projectsReverted++;

    } catch (error) {
      const errorMsg = `Failed to revert project ${project.name}: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  console.log(`   ✅ Reverted ${stats.projectsReverted} projects`);
}

/**
 * Step 2: Delete auto-created organisations
 */
async function deleteAutoCreatedOrganisations(
  stats: RollbackStats,
  dryRun: boolean,
  verbose: boolean
) {
  // Find organisations that were auto-created during migration
  const autoCreatedOrgs = await prisma.organisation.findMany({
    where: {
      OR: [
        { notes: { contains: "Auto-created during migration" } },
        { notes: { contains: "Migrated from Client" } }
      ]
    },
    include: {
      projects: {
        select: { id: true, name: true }
      },
      users: {
        select: { id: true, email: true }
      }
    }
  });

  console.log(`   Found ${autoCreatedOrgs.length} auto-created organisations`);

  for (const org of autoCreatedOrgs) {
    try {
      // Safety check: Don't delete if it has projects
      if (org.projects.length > 0) {
        const warning = `Skipping ${org.name} - has ${org.projects.length} projects attached`;
        console.log(`   ⚠️  ${warning}`);
        stats.errors.push(warning);
        continue;
      }

      if (verbose) {
        console.log(`   Deleting: ${org.name} (Type: ${org.type}, Users: ${org.users.length})`);
      }

      if (!dryRun) {
        await prisma.organisation.delete({
          where: { id: org.id }
        });
      }

      stats.organisationsDeleted++;

    } catch (error) {
      const errorMsg = `Failed to delete organisation ${org.name}: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  console.log(`   ✅ Deleted ${stats.organisationsDeleted} organisations`);

  // Warn about remaining organisations
  const remainingOrgs = await prisma.organisation.count();
  if (remainingOrgs > 0) {
    console.log(`   ℹ️  ${remainingOrgs} organisations remain (manually created or have projects)`);
  }
}

/**
 * Print rollback summary
 */
function printRollbackSummary(stats: RollbackStats, dryRun: boolean) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 ROLLBACK SUMMARY");
  console.log("=".repeat(80));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "PRODUCTION"}`);
  console.log(`Projects Reverted: ${stats.projectsReverted}`);
  console.log(`Organisations Deleted: ${stats.organisationsDeleted}`);
  console.log(`Errors/Warnings: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\n⚠️  Issues encountered:");
    stats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  console.log("=".repeat(80));
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes("--commit");
const verbose = args.includes("--verbose") || args.includes("-v");
const deleteAutoCreated = args.includes("--delete-orgs");

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
⚠️  MIGRATION ROLLBACK SCRIPT

This script will revert the organisation migration changes.

Usage: npx tsx scripts/rollback-migration.ts [options]

Options:
  --commit          Execute the rollback (default is dry-run)
  --delete-orgs     Delete auto-created organisations (default is to keep them)
  --verbose, -v     Show detailed progress
  --help, -h        Show this help message

Examples:
  npx tsx scripts/rollback-migration.ts                              # Dry run
  npx tsx scripts/rollback-migration.ts --verbose                    # Dry run with details
  npx tsx scripts/rollback-migration.ts --commit                     # Revert projects only
  npx tsx scripts/rollback-migration.ts --commit --delete-orgs       # Revert + delete orgs
  npx tsx scripts/rollback-migration.ts --commit --delete-orgs -v    # Full rollback with details

⚠️  WARNING: Use --delete-orgs with caution! It will delete auto-created organisations.
  `);
  process.exit(0);
}

// Confirmation prompt for production rollback
if (!dryRun) {
  console.log("\n⚠️  WARNING: You are about to rollback the migration in PRODUCTION mode!");
  console.log("This will revert project references and potentially delete organisations.");
  console.log("\nPress Ctrl+C to cancel or wait 5 seconds to continue...\n");
  
  // Wait 5 seconds before proceeding
  await new Promise(resolve => setTimeout(resolve, 5000));
}

rollbackMigration({ dryRun, verbose, deleteAutoCreated })
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Rollback failed:", error);
    process.exit(1);
  });
