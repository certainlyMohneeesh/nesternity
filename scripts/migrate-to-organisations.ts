import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MigrationStats {
  usersProcessed: number;
  organisationsCreated: number;
  clientsConverted: number;
  projectsUpdated: number;
  errors: string[];
}

interface MigrationOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * Phase 6: Data Migration Script
 * Transforms the database from Client-based to Organisation-based architecture
 */
async function migrateToOrganisations(options: MigrationOptions = {}) {
  const { dryRun = false, verbose = false } = options;
  
  console.log("\n🚀 Starting Data Migration to Organisations");
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes will be saved)" : "PRODUCTION (changes will be committed)"}`);
  console.log("=" .repeat(80));

  const stats: MigrationStats = {
    usersProcessed: 0,
    organisationsCreated: 0,
    clientsConverted: 0,
    projectsUpdated: 0,
    errors: [],
  };

  try {
    // Step 1: Verify database state
    console.log("\n📊 Step 1: Verifying database state...");
    await verifyDatabaseState(verbose);

    // Step 2: Create default "My Organisation" for each user
    console.log("\n🏢 Step 2: Creating default organisations for users...");
    await createDefaultOrganisations(stats, dryRun, verbose);

    // Step 3: Convert Client records to Organisation (type=CLIENT)
    console.log("\n🔄 Step 3: Converting Client records to Organisations...");
    await convertClientsToOrganisations(stats, dryRun, verbose);

    // Step 4: Update Project.organisationId from Project.clientId
    console.log("\n📋 Step 4: Updating project organisation references...");
    await updateProjectOrganisations(stats, dryRun, verbose);

    // Step 5: Verify data integrity
    console.log("\n✅ Step 5: Verifying data integrity...");
    await verifyDataIntegrity(dryRun, verbose);

    // Print summary
    printMigrationSummary(stats, dryRun);

    if (dryRun) {
      console.log("\n⚠️  This was a DRY RUN. No changes were committed to the database.");
      console.log("Run with --commit flag to apply changes.");
    } else {
      console.log("\n✅ Migration completed successfully!");
      console.log("⚠️  Remember to run the verification script to ensure data integrity.");
    }

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    stats.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

/**
 * Verify the current state of the database before migration
 */
async function verifyDatabaseState(verbose: boolean) {
  const users = await prisma.user.count();
  const clients = await prisma.client.count();
  const projects = await prisma.project.count();
  const organisations = await prisma.organisation.count();

  console.log(`   Users: ${users}`);
  console.log(`   Clients: ${clients}`);
  console.log(`   Projects: ${projects}`);
  console.log(`   Existing Organisations: ${organisations}`);

  if (verbose) {
    // Check for projects without clients
    const projectsWithoutClient = await prisma.project.count({
      where: { clientId: null }
    });
    console.log(`   Projects without client: ${projectsWithoutClient}`);
  }
}

/**
 * Step 2: Create default "My Organisation" for each user
 */
async function createDefaultOrganisations(
  stats: MigrationStats,
  dryRun: boolean,
  verbose: boolean
) {
  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      email: true,
    },
  });

  console.log(`   Found ${users.length} users to process`);

  for (const user of users) {
    try {
      // Check if user already has an OWNER organisation
      const existingOwnerOrg = await prisma.organisation.findFirst({
        where: {
          ownerId: user.id,
          type: "OWNER",
        },
      });

      if (existingOwnerOrg) {
        if (verbose) {
          console.log(`   ℹ️  User ${user.email} already has an owner organisation: ${existingOwnerOrg.name}`);
        }
        continue;
      }

      // Create default organisation
      const orgName = user.displayName ? `${user.displayName}'s Organisation` : "My Organisation";
      
      if (verbose) {
        console.log(`   Creating: "${orgName}" for ${user.email}`);
      }

      if (!dryRun) {
        await prisma.organisation.create({
          data: {
            name: orgName,
            type: "OWNER",
            status: "ACTIVE",
            email: user.email,
            notes: "Auto-created during migration to organisation-centric architecture",
            ownerId: user.id,
          },
        });
      }

      stats.organisationsCreated++;
      stats.usersProcessed++;

    } catch (error) {
      const errorMsg = `Failed to create organisation for user ${user.email}: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  console.log(`   ✅ Created ${stats.organisationsCreated} default organisations`);
}

/**
 * Step 3: Convert existing Client records to Organisation (type=CLIENT)
 */
async function convertClientsToOrganisations(
  stats: MigrationStats,
  dryRun: boolean,
  verbose: boolean
) {
  // Get all clients that haven't been converted yet
  const clients = await prisma.client.findMany({
    include: {
      createdByUser: {
        select: {
          id: true,
          email: true,
        }
      },
      projects: {
        select: {
          id: true,
          name: true,
        }
      }
    },
  });

  console.log(`   Found ${clients.length} clients to convert`);

  for (const client of clients) {
    try {
      // Check if organisation already exists for this client
      const existingOrg = await prisma.organisation.findFirst({
        where: {
          OR: [
            { email: client.email },
            { 
              AND: [
                { name: client.name },
                { ownerId: client.createdBy }
              ]
            }
          ]
        },
      });

      if (existingOrg) {
        if (verbose) {
          console.log(`   ℹ️  Organisation already exists for client: ${client.name}`);
        }
        continue;
      }

      if (verbose) {
        console.log(`   Converting client: ${client.name} (${client.projects.length} projects)`);
      }

      if (!dryRun) {
        // Create organisation from client data
        await prisma.organisation.create({
          data: {
            name: client.name,
            type: "CLIENT",
            status: client.status === "ACTIVE" ? "ACTIVE" : 
                   client.status === "INACTIVE" ? "INACTIVE" : "PROSPECT",
            email: client.email || undefined,
            phone: client.phone || undefined,
            address: client.address || undefined,
            budget: client.budget || undefined,
            currency: client.currency || "INR",
            notes: client.notes || `Migrated from Client (ID: ${client.id})`,
            ownerId: client.createdBy,
            // We'll update project references in the next step
          },
        });
      }

      stats.clientsConverted++;

    } catch (error) {
      const errorMsg = `Failed to convert client ${client.name}: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  console.log(`   ✅ Converted ${stats.clientsConverted} clients to organisations`);
}

/**
 * Step 4: Update Project.organisationId from Project.clientId
 */
async function updateProjectOrganisations(
  stats: MigrationStats,
  dryRun: boolean,
  verbose: boolean
) {
  // Get all projects that have a clientId but no organisationId
  const projects = await prisma.project.findMany({
    where: {
      clientId: { not: null },
      organisationId: null,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          createdBy: true,
        }
      }
    },
  });

  console.log(`   Found ${projects.length} projects to update`);

  for (const project of projects) {
    if (!project.client) {
      const errorMsg = `Project ${project.name} has clientId but client not found`;
      console.error(`   ⚠️  ${errorMsg}`);
      stats.errors.push(errorMsg);
      continue;
    }

    try {
      // Find the corresponding organisation for this client
      const organisation = await prisma.organisation.findFirst({
        where: {
          type: "CLIENT",
          OR: [
            { email: project.client.email },
            {
              AND: [
                { name: project.client.name },
                { ownerId: project.client.createdBy }
              ]
            }
          ]
        },
      });

      if (!organisation) {
        const errorMsg = `No organisation found for project "${project.name}" (client: ${project.client.name})`;
        console.error(`   ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
        continue;
      }

      if (verbose) {
        console.log(`   Updating project: ${project.name} → ${organisation.name}`);
      }

      if (!dryRun) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            organisationId: organisation.id,
            // Keep clientId for now for rollback purposes
          },
        });
      }

      stats.projectsUpdated++;

    } catch (error) {
      const errorMsg = `Failed to update project ${project.name}: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  console.log(`   ✅ Updated ${stats.projectsUpdated} projects`);
}

/**
 * Step 5: Verify data integrity after migration
 */
async function verifyDataIntegrity(dryRun: boolean, verbose: boolean) {
  const issues: string[] = [];

  // Check 1: Every user should have at least one OWNER organisation
  const usersWithoutOwnerOrg = await prisma.user.findMany({
    where: {
      organisations: {
        none: {
          type: "OWNER"
        }
      }
    },
    select: { id: true, email: true }
  });

  if (usersWithoutOwnerOrg.length > 0) {
    issues.push(`${usersWithoutOwnerOrg.length} users without OWNER organisation`);
    if (verbose) {
      usersWithoutOwnerOrg.forEach(user => {
        console.log(`   ⚠️  User ${user.email} has no OWNER organisation`);
      });
    }
  }

  // Check 2: All projects should have organisationId (if not in dry run)
  if (!dryRun) {
    const projectsWithoutOrg = await prisma.project.count({
      where: { organisationId: null }
    });

    if (projectsWithoutOrg > 0) {
      issues.push(`${projectsWithoutOrg} projects without organisationId`);
    }
  }

  // Check 3: Count organisations by type
  const ownerOrgs = await prisma.organisation.count({ where: { type: "OWNER" } });
  const clientOrgs = await prisma.organisation.count({ where: { type: "CLIENT" } });

  console.log(`   Owner Organisations: ${ownerOrgs}`);
  console.log(`   Client Organisations: ${clientOrgs}`);
  console.log(`   Total Organisations: ${ownerOrgs + clientOrgs}`);

  if (issues.length > 0) {
    console.log("\n   ⚠️  Data integrity issues found:");
    issues.forEach(issue => console.log(`      - ${issue}`));
  } else {
    console.log("   ✅ No data integrity issues found");
  }

  return issues;
}

/**
 * Print migration summary
 */
function printMigrationSummary(stats: MigrationStats, dryRun: boolean) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(80));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "PRODUCTION"}`);
  console.log(`Users Processed: ${stats.usersProcessed}`);
  console.log(`Default Organisations Created: ${stats.organisationsCreated}`);
  console.log(`Clients Converted: ${stats.clientsConverted}`);
  console.log(`Projects Updated: ${stats.projectsUpdated}`);
  console.log(`Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log("\n❌ Errors encountered:");
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

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: npx tsx scripts/migrate-to-organisations.ts [options]

Options:
  --commit          Execute the migration (default is dry-run)
  --verbose, -v     Show detailed progress
  --help, -h        Show this help message

Examples:
  npx tsx scripts/migrate-to-organisations.ts                    # Dry run
  npx tsx scripts/migrate-to-organisations.ts --verbose          # Dry run with details
  npx tsx scripts/migrate-to-organisations.ts --commit           # Execute migration
  npx tsx scripts/migrate-to-organisations.ts --commit --verbose # Execute with details
  `);
  process.exit(0);
}

migrateToOrganisations({ dryRun, verbose })
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
