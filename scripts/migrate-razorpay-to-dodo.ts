#!/usr/bin/env bun
/**
 * Migration Script: Razorpay to Dodo Payments
 * 
 * This script helps migrate existing Razorpay subscription data to Dodo Payments.
 * It generates a report of current subscriptions and provides guidance for manual migration.
 * 
 * Usage:
 *   bun run scripts/migrate-razorpay-to-dodo.ts --dry-run   # Preview changes
 *   bun run scripts/migrate-razorpay-to-dodo.ts --export    # Export data for manual migration
 */

import { PrismaClient } from '../src/generated/client.js';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface MigrationReport {
  timestamp: string;
  totalRazorpayCustomers: number;
  totalRazorpaySubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  customers: Array<{
    userId: string;
    email: string;
    razorpayCustomerId: string;
    subscriptions: Array<{
      razorpaySubscriptionId: string;
      status: string;
      planTier: string;
      currentPeriodEnd: Date;
    }>;
  }>;
}

async function generateMigrationReport(): Promise<MigrationReport> {
  console.log('📊 Generating migration report...\n');

  // Fetch all Razorpay customers with their subscriptions
  const razorpayCustomers = await prisma.razorpayCustomer.findMany({
    include: {
      subscriptions: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
  });

  const activeSubscriptions = razorpayCustomers.reduce(
    (count: number, customer: any) => 
      count + customer.subscriptions.filter((sub: any) => sub.status === 'ACTIVE').length,
    0
  );

  const cancelledSubscriptions = razorpayCustomers.reduce(
    (count: number, customer: any) => 
      count + customer.subscriptions.filter((sub: any) => sub.status === 'CANCELLED').length,
    0
  );

  const expiredSubscriptions = razorpayCustomers.reduce(
    (count: number, customer: any) => 
      count + customer.subscriptions.filter((sub: any) => sub.status === 'EXPIRED').length,
    0
  );

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    totalRazorpayCustomers: razorpayCustomers.length,
    totalRazorpaySubscriptions: razorpayCustomers.reduce(
      (count: number, customer: any) => count + customer.subscriptions.length,
      0
    ),
    activeSubscriptions,
    cancelledSubscriptions,
    expiredSubscriptions,
    customers: razorpayCustomers.map((customer: any) => ({
      userId: customer.userId,
      email: customer.email,
      razorpayCustomerId: customer.razorpayCustomerId,
      subscriptions: customer.subscriptions.map((sub: any) => ({
        razorpaySubscriptionId: sub.razorpaySubscriptionId,
        status: sub.status,
        planTier: sub.planTier,
        currentPeriodEnd: sub.currentPeriodEnd,
      })),
    })),
  };

  return report;
}

function printReport(report: MigrationReport) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         RAZORPAY TO DODO PAYMENTS MIGRATION REPORT        ');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📅 Generated: ${new Date(report.timestamp).toLocaleString()}\n`);

  console.log('📊 SUMMARY');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Total Customers:           ${report.totalRazorpayCustomers}`);
  console.log(`Total Subscriptions:       ${report.totalRazorpaySubscriptions}`);
  console.log(`  └─ Active:               ${report.activeSubscriptions}`);
  console.log(`  └─ Cancelled:            ${report.cancelledSubscriptions}`);
  console.log(`  └─ Expired:              ${report.expiredSubscriptions}\n`);

  if (report.customers.length > 0) {
    console.log('👥 CUSTOMERS & SUBSCRIPTIONS');
    console.log('─────────────────────────────────────────────────────────');

    report.customers.forEach((customer, index) => {
      console.log(`\n${index + 1}. ${customer.email}`);
      console.log(`   User ID: ${customer.userId}`);
      console.log(`   Razorpay Customer ID: ${customer.razorpayCustomerId}`);
      
      if (customer.subscriptions.length > 0) {
        console.log(`   Subscriptions (${customer.subscriptions.length}):`);
        customer.subscriptions.forEach((sub, subIndex) => {
          console.log(`     ${subIndex + 1}. ${sub.status} - ${sub.planTier}`);
          console.log(`        Subscription ID: ${sub.razorpaySubscriptionId}`);
          console.log(`        Period End: ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`);
        });
      } else {
        console.log(`   No active subscriptions`);
      }
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

function exportReport(report: MigrationReport) {
  const exportDir = path.join(process.cwd(), 'migrations', 'exports');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filename = `razorpay-migration-${Date.now()}.json`;
  const filepath = path.join(exportDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

  console.log(`✅ Report exported to: ${filepath}\n`);
  return filepath;
}

function printMigrationInstructions() {
  console.log('📋 MIGRATION INSTRUCTIONS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('To migrate to Dodo Payments, follow these steps:\n');

  console.log('1️⃣  SET UP DODO PAYMENTS ACCOUNT');
  console.log('   • Sign up at https://dodopayments.com');
  console.log('   • Create subscription products matching your current plans');
  console.log('   • Note down the product IDs\n');

  console.log('2️⃣  CONFIGURE ENVIRONMENT VARIABLES');
  console.log('   Add to your .env file:');
  console.log('   DODO_API_KEY="your_dodo_api_key"');
  console.log('   DODO_MODE="test"  # or "live" for production');
  console.log('   DODO_WEBHOOK_SECRET="your_webhook_secret"\n');

  console.log('3️⃣  RUN DATABASE MIGRATION');
  console.log('   bun run prisma:generate');
  console.log('   bun run prisma:migrate:deploy\n');

  console.log('4️⃣  UPDATE SUBSCRIPTION PLANS IN DATABASE');
  console.log('   Update SubscriptionPlan records with Dodo product IDs\n');

  console.log('5️⃣  SET UP WEBHOOK ENDPOINT');
  console.log('   • Configure webhook in Dodo dashboard');
  console.log('   • URL: https://yourdomain.com/api/dodo/webhook');
  console.log('   • Events: All subscription and payment events\n');

  console.log('6️⃣  MIGRATE ACTIVE CUSTOMERS');
  console.log('   For each active subscription:');
  console.log('   • Create customer in Dodo via API or dashboard');
  console.log('   • Create checkout session for new subscription');
  console.log('   • Send email to customer with checkout link');
  console.log('   • Cancel old Razorpay subscription after confirmation\n');

  console.log('7️⃣  UPDATE CLIENT-SIDE CODE');
  console.log('   Replace Razorpay API calls with Dodo endpoints:');
  console.log('   • /api/razorpay/subscription → /api/dodo/subscription');
  console.log('   • /api/razorpay/subscription/create → /api/dodo/checkout/create');
  console.log('   • Add customer portal: /api/dodo/portal\n');

  console.log('8️⃣  TESTING');
  console.log('   • Test in Dodo test mode first');
  console.log('   • Verify webhook events are received correctly');
  console.log('   • Test checkout flow end-to-end');
  console.log('   • Test customer portal functionality\n');

  console.log('9️⃣  CLEANUP');
  console.log('   After successful migration:');
  console.log('   • Archive Razorpay models in schema');
  console.log('   • Remove old Razorpay API routes');
  console.log('   • Update documentation\n');

  console.log('═══════════════════════════════════════════════════════════\n');
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isExport = args.includes('--export');

  console.log('🚀 Starting Razorpay to Dodo Payments migration analysis...\n');

  try {
    // Generate report
    const report = await generateMigrationReport();

    // Print report
    printReport(report);

    // Export if requested
    if (isExport) {
      exportReport(report);
    }

    // Print instructions
    printMigrationInstructions();

    if (report.activeSubscriptions > 0) {
      console.log('⚠️  WARNING');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`You have ${report.activeSubscriptions} active subscriptions.`);
      console.log('Manual migration is required to avoid service disruption.');
      console.log('Follow the instructions above carefully.\n');
    }

    console.log('✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error during migration analysis:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
