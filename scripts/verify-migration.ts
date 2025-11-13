import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Verification Script for Organisation Migration
 * Runs comprehensive checks on the migrated data
 */
async function verifyMigration() {
  console.log("\n🔍 MIGRATION VERIFICATION REPORT");
  console.log("=".repeat(80));

  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. User Coverage
    console.log("\n1️⃣  Checking User Coverage...");
    const totalUsers = await prisma.user.count();
    const usersWithOrgs = await prisma.user.count({
      where: {
        organisations: {
          some: {}
        }
      }
    });
    const usersWithOwnerOrg = await prisma.user.count({
      where: {
        organisations: {
          some: { type: "OWNER" }
        }
      }
    });

    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Users with Organisations: ${usersWithOrgs}`);
    console.log(`   Users with OWNER Organisation: ${usersWithOwnerOrg}`);

    if (usersWithOwnerOrg < totalUsers) {
      issues.push(`${totalUsers - usersWithOwnerOrg} users missing OWNER organisation`);
    } else {
      console.log("   ✅ All users have OWNER organisation");
    }

    // 2. Organisation Types
    console.log("\n2️⃣  Checking Organisation Types...");
    const ownerOrgs = await prisma.organisation.count({ where: { type: "OWNER" } });
    const clientOrgs = await prisma.organisation.count({ where: { type: "CLIENT" } });
    const totalOrgs = ownerOrgs + clientOrgs;

    console.log(`   OWNER Organisations: ${ownerOrgs}`);
    console.log(`   CLIENT Organisations: ${clientOrgs}`);
    console.log(`   Total Organisations: ${totalOrgs}`);

    // 3. Client to Organisation Conversion
    console.log("\n3️⃣  Checking Client Conversion...");
    const totalClients = await prisma.client.count();
    
    console.log(`   Total Clients in database: ${totalClients}`);
    console.log(`   CLIENT Organisations created: ${clientOrgs}`);

    if (clientOrgs < totalClients) {
      warnings.push(`Only ${clientOrgs} of ${totalClients} clients converted to organisations`);
    } else {
      console.log("   ✅ All clients converted to organisations");
    }

    // 4. Project Organisation References
    console.log("\n4️⃣  Checking Project References...");
    const totalProjects = await prisma.project.count();
    
    // Get all projects and filter in memory to avoid Prisma null filter issues
    const allProjects = await prisma.project.findMany({
      select: {
        organisationId: true,
        clientId: true
      }
    });
    
    const projectsWithOrgId = allProjects.filter(p => p.organisationId !== null).length;
    const projectsWithClientId = allProjects.filter(p => p.clientId !== null).length;
    const projectsWithBoth = allProjects.filter(p => p.organisationId !== null && p.clientId !== null).length;
    const projectsOrphaned = allProjects.filter(p => p.organisationId === null && p.clientId === null).length;

    console.log(`   Total Projects: ${totalProjects}`);
    console.log(`   Projects with organisationId: ${projectsWithOrgId}`);
    console.log(`   Projects with clientId: ${projectsWithClientId}`);
    console.log(`   Projects with both: ${projectsWithBoth}`);
    console.log(`   Orphaned projects: ${projectsOrphaned}`);

    if (projectsWithOrgId < totalProjects) {
      issues.push(`${totalProjects - projectsWithOrgId} projects missing organisationId`);
    } else {
      console.log("   ✅ All projects have organisationId");
    }

    if (projectsOrphaned > 0) {
      issues.push(`${projectsOrphaned} projects are orphaned (no org or client)`);
    }

    // 5. Organisation Status Distribution
    console.log("\n5️⃣  Checking Organisation Status Distribution...");
    const activeOrgs = await prisma.organisation.count({ where: { status: "ACTIVE" } });
    const inactiveOrgs = await prisma.organisation.count({ where: { status: "INACTIVE" } });
    const prospectOrgs = await prisma.organisation.count({ where: { status: "PROSPECT" } });

    console.log(`   ACTIVE: ${activeOrgs}`);
    console.log(`   INACTIVE: ${inactiveOrgs}`);
    console.log(`   PROSPECT: ${prospectOrgs}`);

    // 6. Organisation Contact Information
    console.log("\n6️⃣  Checking Organisation Contact Information...");
    
    // Get all orgs and filter in memory to avoid Prisma null filter issues
    const allOrgs = await prisma.organisation.findMany({
      select: {
        email: true,
        phone: true,
        address: true
      }
    });
    
    const orgsWithEmail = allOrgs.filter(org => org.email !== null).length;
    const orgsWithPhone = allOrgs.filter(org => org.phone !== null).length;
    const orgsWithAddress = allOrgs.filter(org => org.address !== null).length;

    console.log(`   Organisations with email: ${orgsWithEmail}/${totalOrgs}`);
    console.log(`   Organisations with phone: ${orgsWithPhone}/${totalOrgs}`);
    console.log(`   Organisations with address: ${orgsWithAddress}/${totalOrgs}`);

    if (orgsWithEmail < totalOrgs * 0.5) {
      warnings.push(`Only ${orgsWithEmail} organisations have email addresses`);
    }

    // 7. Project to Organisation Relationship Integrity
    console.log("\n7️⃣  Checking Relationship Integrity...");
    
    // Check manually by fetching all projects with organisationId and checking if org exists
    const projectsWithOrgIds = await prisma.project.findMany({
      where: {
        organisationId: { not: null }
      },
      select: {
        id: true,
        organisationId: true,
        organisation: {
          select: {
            id: true
          }
        }
      }
    });
    
    const projectsWithInvalidOrg = projectsWithOrgIds.filter(p => !p.organisation).length;

    if (projectsWithInvalidOrg > 0) {
      issues.push(`${projectsWithInvalidOrg} projects reference non-existent organisations`);
    } else {
      console.log("   ✅ All project-organisation relationships are valid");
    }

    // 8. Sample Data Inspection
    console.log("\n8️⃣  Sample Data Inspection...");
    
    // Sample OWNER organisation
    const sampleOwner = await prisma.organisation.findFirst({
      where: { type: "OWNER" },
      include: {
        owner: { select: { email: true, displayName: true } },
        projects: { select: { name: true } }
      }
    });

    if (sampleOwner) {
      console.log(`   Sample OWNER Organisation:`);
      console.log(`      Name: ${sampleOwner.name}`);
      console.log(`      Owner: ${sampleOwner.owner.displayName} (${sampleOwner.owner.email})`);
      console.log(`      Projects: ${sampleOwner.projects.length}`);
    }

    // Sample CLIENT organisation
    const sampleClient = await prisma.organisation.findFirst({
      where: { type: "CLIENT" },
      include: {
        owner: { select: { email: true, displayName: true } },
        projects: { select: { name: true } }
      }
    });

    if (sampleClient) {
      console.log(`   Sample CLIENT Organisation:`);
      console.log(`      Name: ${sampleClient.name}`);
      console.log(`      Owner: ${sampleClient.owner.displayName} (${sampleClient.owner.email})`);
      console.log(`      Projects: ${sampleClient.projects.length}`);
    }

    // 9. Detailed Project Check
    console.log("\n9️⃣  Detailed Project Analysis...");
    
    // Projects that should have been migrated but weren't
    const unmigrated = allProjects.filter(p => p.clientId !== null && p.organisationId === null);

    if (unmigrated.length > 0) {
      console.log(`   ⚠️  Found ${unmigrated.length} unmigrated projects`);
      issues.push(`${unmigrated.length} projects not migrated to organisations`);
    } else {
      console.log("   ✅ All projects with clients have been migrated");
    }

    // 10. Data Consistency
    console.log("\n🔟  Data Consistency Checks...");
    
    // Check for duplicate organisations (same name + same owner)
    const orgs = await prisma.organisation.findMany({
      select: {
        name: true,
        ownerId: true
      }
    });

    const orgMap = new Map<string, number>();
    orgs.forEach(org => {
      const key = `${org.name}|${org.ownerId}`;
      orgMap.set(key, (orgMap.get(key) || 0) + 1);
    });

    const duplicates = Array.from(orgMap.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      warnings.push(`Found ${duplicates.length} potential duplicate organisations`);
      console.log(`   ⚠️  Potential duplicates found: ${duplicates.length}`);
    } else {
      console.log("   ✅ No duplicate organisations detected");
    }

    // Final Summary
    console.log("\n" + "=".repeat(80));
    console.log("📋 VERIFICATION SUMMARY");
    console.log("=".repeat(80));
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log("✅ MIGRATION SUCCESSFUL - No issues or warnings found!");
    } else {
      if (issues.length > 0) {
        console.log(`\n❌ CRITICAL ISSUES (${issues.length}):`);
        issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
      }
      
      if (warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
        warnings.forEach((warning, i) => {
          console.log(`   ${i + 1}. ${warning}`);
        });
      }
    }

    console.log("\n" + "=".repeat(80));

    // Return status
    return {
      success: issues.length === 0,
      issues,
      warnings,
      stats: {
        totalUsers,
        usersWithOrgs,
        usersWithOwnerOrg,
        totalOrgs,
        ownerOrgs,
        clientOrgs,
        totalProjects,
        projectsWithOrgId,
        projectsOrphaned,
      }
    };

  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyMigration()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(() => {
    process.exit(1);
  });
