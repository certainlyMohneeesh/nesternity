#!/usr/bin/env node

/**
 * Data Migration Script: Add organisationId to all models
 * 
 * This script migrates existing data to populate the new organisationId field
 * in models that previously didn't have it: Team, Board, Client, Invoice, Proposal, Issue
 * 
 * Run after: npx prisma migrate dev --name add_organisation_id_to_all_models
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting organisationId migration...\n');

  try {
    // 1. Migrate Teams
    console.log('📦 Migrating Teams...');
    const teamsWithoutOrgId = await prisma.team.findMany({
      where: { organisationId: null },
      include: { projects: { include: { organisation: true } } }
    });

    let teamsUpdated = 0;
    for (const team of teamsWithoutOrgId) {
      // Get organisationId from the first project
      const firstProject = team.projects[0];
      if (firstProject && firstProject.organisationId) {
        await prisma.team.update({
          where: { id: team.id },
          data: { organisationId: firstProject.organisationId }
        });
        teamsUpdated++;
      } else {
        console.warn(`  ⚠️  Team ${team.id} has no projects - skipping`);
      }
    }
    console.log(`  ✅ Updated ${teamsUpdated} teams\n`);

    // 2. Migrate Boards
    console.log('📋 Migrating Boards...');
    const boardsWithoutOrgId = await prisma.board.findMany({
      where: { organisationId: null },
      include: { project: true, team: true }
    });

    let boardsUpdated = 0;
    for (const board of boardsWithoutOrgId) {
      let organisationId = null;
      
      // Try to get from project first
      if (board.projectId && board.project) {
        organisationId = board.project.organisationId;
      } 
      // Otherwise get from team (which should now have organisationId)
      else if (board.team && board.team.organisationId) {
        organisationId = board.team.organisationId;
      }

      if (organisationId) {
        await prisma.board.update({
          where: { id: board.id },
          data: { organisationId }
        });
        boardsUpdated++;
      } else {
        console.warn(`  ⚠️  Board ${board.id} has no project or team org - skipping`);
      }
    }
    console.log(`  ✅ Updated ${boardsUpdated} boards\n`);

    // 3. Migrate Clients
    console.log('👥 Migrating Clients...');
    const clientsWithoutOrgId = await prisma.client.findMany({
      where: { organisationId: null },
      include: { 
        createdByUser: { 
          include: { 
            organisations: { where: { type: 'OWNER' } } 
          } 
        } 
      }
    });

    let clientsUpdated = 0;
    for (const client of clientsWithoutOrgId) {
      // Get the user's primary (OWNER) organisation
      const primaryOrg = client.createdByUser.organisations[0];
      
      if (primaryOrg) {
        await prisma.client.update({
          where: { id: client.id },
          data: { organisationId: primaryOrg.id }
        });
        clientsUpdated++;
      } else {
        console.warn(`  ⚠️  Client ${client.id} - user has no organisations - skipping`);
      }
    }
    console.log(`  ✅ Updated ${clientsUpdated} clients\n`);

    // 4. Migrate Invoices
    console.log('🧾 Migrating Invoices...');
    const invoicesWithoutOrgId = await prisma.invoice.findMany({
      where: { organisationId: null },
      include: { client: true }
    });

    let invoicesUpdated = 0;
    for (const invoice of invoicesWithoutOrgId) {
      if (invoice.client && invoice.client.organisationId) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { organisationId: invoice.client.organisationId }
        });
        invoicesUpdated++;
      } else {
        console.warn(`  ⚠️  Invoice ${invoice.id} - client has no org - skipping`);
      }
    }
    console.log(`  ✅ Updated ${invoicesUpdated} invoices\n`);

    // 5. Migrate Proposals
    console.log('📄 Migrating Proposals...');
    const proposalsWithoutOrgId = await prisma.proposal.findMany({
      where: { organisationId: null },
      include: { project: true, client: true }
    });

    let proposalsUpdated = 0;
    for (const proposal of proposalsWithoutOrgId) {
      let organisationId = null;

      // Try project first
      if (proposal.projectId && proposal.project) {
        organisationId = proposal.project.organisationId;
      }
      // Otherwise try client
      else if (proposal.client && proposal.client.organisationId) {
        organisationId = proposal.client.organisationId;
      }

      if (organisationId) {
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: { organisationId }
        });
        proposalsUpdated++;
      } else {
        console.warn(`  ⚠️  Proposal ${proposal.id} - no project or client org - skipping`);
      }
    }
    console.log(`  ✅ Updated ${proposalsUpdated} proposals\n`);

    // 6. Migrate Issues
    console.log('🐛 Migrating Issues...');
    const issuesWithoutOrgId = await prisma.issue.findMany({
      where: { organisationId: null },
      include: { project: true, board: true }
    });

    let issuesUpdated = 0;
    for (const issue of issuesWithoutOrgId) {
      let organisationId = null;

      // Try project first
      if (issue.projectId && issue.project) {
        organisationId = issue.project.organisationId;
      }
      // Otherwise try board
      else if (issue.boardId && issue.board && issue.board.organisationId) {
        organisationId = issue.board.organisationId;
      }

      if (organisationId) {
        await prisma.issue.update({
          where: { id: issue.id },
          data: { organisationId }
        });
        issuesUpdated++;
      } else {
        console.warn(`  ⚠️  Issue ${issue.id} - no project or board org - skipping`);
      }
    }
    console.log(`  ✅ Updated ${issuesUpdated} issues\n`);

    // Summary
    console.log('✨ Migration Summary:');
    console.log(`  Teams:     ${teamsUpdated} updated`);
    console.log(`  Boards:    ${boardsUpdated} updated`);
    console.log(`  Clients:   ${clientsUpdated} updated`);
    console.log(`  Invoices:  ${invoicesUpdated} updated`);
    console.log(`  Proposals: ${proposalsUpdated} updated`);
    console.log(`  Issues:    ${issuesUpdated} updated`);
    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
