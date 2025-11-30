import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MigrationStats {
    teamsProcessed: number;
    teamsUpdated: number;
    errors: string[];
}

interface MigrationOptions {
    dryRun?: boolean;
    verbose?: boolean;
}

/**
 * Team Organisation ID Migration Script
 * Fixes teams that are missing organisationId by inferring it from their projects
 */
async function fixTeamOrganisationIds(options: MigrationOptions = {}) {
    const { dryRun = false, verbose = false } = options;

    console.log("\n🚀 Starting Team Organisation ID Fix Migration");
    console.log(`Mode: ${dryRun ? "DRY RUN (no changes will be saved)" : "PRODUCTION (changes will be committed)"}`);
    console.log("=".repeat(80));

    const stats: MigrationStats = {
        teamsProcessed: 0,
        teamsUpdated: 0,
        errors: [],
    };

    try {
        // Step 1: Verify database state
        console.log("\n📊 Step 1: Verifying database state...");
        await verifyDatabaseState(verbose);

        // Step 2: Fix teams missing organisationId
        console.log("\n🔧 Step 2: Fixing teams with missing organisationId...");
        await fixMissingOrganisationIds(stats, dryRun, verbose);

        // Step 3: Verify data integrity
        console.log("\n✅ Step 3: Verifying data integrity...");
        await verifyDataIntegrity(dryRun, verbose);

        // Print summary
        printMigrationSummary(stats, dryRun);

        if (dryRun) {
            console.log("\n⚠️  This was a DRY RUN. No changes were committed to the database.");
            console.log("Run with --commit flag to apply changes.");
        } else {
            console.log("\n✅ Migration completed successfully!");
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
    const totalTeams = await prisma.team.count();
    const teamsWithoutOrg = await prisma.team.count({
        where: { organisationId: null }
    });
    const teamsWithOrg = totalTeams - teamsWithoutOrg;
    const projects = await prisma.project.count();

    console.log(`   Total Teams: ${totalTeams}`);
    console.log(`   Teams with organisationId: ${teamsWithOrg}`);
    console.log(`   Teams without organisationId: ${teamsWithoutOrg}`);
    console.log(`   Total Projects: ${projects}`);

    if (verbose && teamsWithoutOrg > 0) {
        const teamsInfo = await prisma.team.findMany({
            where: { organisationId: null },
            select: {
                id: true,
                name: true,
                createdBy: true,
                projects: {
                    select: {
                        id: true,
                        name: true,
                        organisationId: true
                    }
                }
            },
            take: 5
        });

        console.log("\n   Sample teams without organisationId:");
        teamsInfo.forEach(team => {
            console.log(`   - ${team.name} (${team.projects.length} projects)`);
            team.projects.forEach(p => {
                console.log(`     → Project: ${p.name} (orgId: ${p.organisationId || 'NULL'})`);
            });
        });
    }
}

/**
 * Step 2: Fix teams with missing organisationId
 * Strategy:
 * 1. If team has projects, use the organisationId from the first project
 * 2. If team has no projects, use the owner's default organisation
 */
async function fixMissingOrganisationIds(
    stats: MigrationStats,
    dryRun: boolean,
    verbose: boolean
) {
    const teamsToFix = await prisma.team.findMany({
        where: { organisationId: null },
        include: {
            owner: {
                select: {
                    id: true,
                    email: true,
                }
            },
            projects: {
                select: {
                    id: true,
                    name: true,
                    organisationId: true,
                },
                take: 1
            },
            members: {
                select: {
                    userId: true
                }
            }
        },
    });

    console.log(`   Found ${teamsToFix.length} teams to fix`);

    for (const team of teamsToFix) {
        try {
            stats.teamsProcessed++;
            let organisationId: string | null = null;

            // Strategy 1: Get organisationId from team's project
            if (team.projects.length > 0 && team.projects[0].organisationId) {
                organisationId = team.projects[0].organisationId;

                if (verbose) {
                    console.log(`   ✓ Team "${team.name}" → org from project "${team.projects[0].name}"`);
                }
            }
            // Strategy 2: Get owner's default organisation
            else {
                const ownerOrganisation = await prisma.organisation.findFirst({
                    where: {
                        ownerId: team.createdBy,
                        type: "OWNER"
                    },
                    select: {
                        id: true,
                        name: true
                    }
                });

                if (ownerOrganisation) {
                    organisationId = ownerOrganisation.id;

                    if (verbose) {
                        console.log(`   ✓ Team "${team.name}" → owner's org "${ownerOrganisation.name}"`);
                    }
                } else {
                    const errorMsg = `Team "${team.name}" (${team.id}): Owner ${team.owner.email} has no OWNER organisation`;
                    console.error(`   ⚠️  ${errorMsg}`);
                    stats.errors.push(errorMsg);
                    continue;
                }
            }

            // Update the team
            if (organisationId && !dryRun) {
                await prisma.team.update({
                    where: { id: team.id },
                    data: { organisationId }
                });
            }

            if (organisationId) {
                stats.teamsUpdated++;
            }

        } catch (error) {
            const errorMsg = `Failed to fix team "${team.name}": ${error}`;
            console.error(`   ❌ ${errorMsg}`);
            stats.errors.push(errorMsg);
        }
    }

    console.log(`   ✅ Fixed ${stats.teamsUpdated} teams`);
}

/**
 * Step 3: Verify data integrity after migration
 */
async function verifyDataIntegrity(dryRun: boolean, verbose: boolean) {
    const issues: string[] = [];

    // Check 1: Teams without organisationId (should be 0 after migration)
    if (!dryRun) {
        const teamsWithoutOrg = await prisma.team.count({
            where: { organisationId: null }
        });

        if (teamsWithoutOrg > 0) {
            issues.push(`${teamsWithoutOrg} teams still without organisationId`);
        } else {
            console.log("   ✅ All teams have organisationId");
        }
    }

    // Check 2: Teams should belong to same organisation as their projects
    const teamsWithProjects = await prisma.team.findMany({
        where: {
            projects: {
                some: {}
            }
        },
        select: {
            id: true,
            name: true,
            organisationId: true,
            projects: {
                select: {
                    id: true,
                    name: true,
                    organisationId: true
                }
            }
        }
    });

    let mismatchCount = 0;
    for (const team of teamsWithProjects) {
        for (const project of team.projects) {
            if (team.organisationId !== project.organisationId) {
                mismatchCount++;
                if (verbose) {
                    console.log(`   ⚠️  Team "${team.name}" (org: ${team.organisationId}) has project "${project.name}" (org: ${project.organisationId})`);
                }
            }
        }
    }

    if (mismatchCount > 0) {
        issues.push(`${mismatchCount} team-project organisation mismatches`);
    }

    // Summary
    const totalTeams = await prisma.team.count();
    const teamsWithOrg = await prisma.team.count({
        where: { organisationId: { not: null } }
    });

    console.log(`   Total Teams: ${totalTeams}`);
    console.log(`   Teams with organisationId: ${teamsWithOrg}`);

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
    console.log(`Teams Processed: ${stats.teamsProcessed}`);
    console.log(`Teams Updated: ${stats.teamsUpdated}`);
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
Usage: npx tsx scripts/fix-team-organisation-ids.ts [options]

Options:
  --commit          Execute the migration (default is dry-run)
  --verbose, -v     Show detailed progress
  --help, -h        Show this help message

Examples:
  npx tsx scripts/fix-team-organisation-ids.ts                    # Dry run
  npx tsx scripts/fix-team-organisation-ids.ts --verbose          # Dry run with details
  npx tsx scripts/fix-team-organisation-ids.ts --commit           # Execute migration
  npx tsx scripts/fix-team-organisation-ids.ts --commit --verbose # Execute with details
  `);
    process.exit(0);
}

fixTeamOrganisationIds({ dryRun, verbose })
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error("Migration failed:", error);
        process.exit(1);
    });
