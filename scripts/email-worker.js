#!/usr/bin/env node

/**
 * Email Worker Startup Script
 * Run this alongside your Next.js app to process email queue
 * Usage: node scripts/email-worker.js
 */

const path = require('path');

// Set up environment
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Import and start the email worker
async function startEmailWorker() {
  try {
    // Import the email queue module
    const { emailWorker, emailQueue } = require('../src/lib/email-queue.ts');
    
    console.log('🚀 Starting email worker...');
    console.log(`📧 Processing queue: ${emailQueue.name}`);
    console.log(`🔗 Redis connected: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
    
    // Worker event listeners for monitoring
    emailWorker.on('completed', (job) => {
      console.log(`✅ Email job ${job.id} completed successfully`);
    });

    emailWorker.on('failed', (job, err) => {
      console.error(`❌ Email job ${job?.id} failed:`, err);
    });

    emailWorker.on('stalled', (jobId) => {
      console.warn(`⚠️ Email job ${jobId} stalled`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🔄 Shutting down email worker...');
      await emailWorker.close();
      await emailQueue.close();
      console.log('✅ Email worker shut down gracefully');
      process.exit(0);
    });

    console.log('✅ Email worker started and ready to process jobs');

  } catch (error) {
    console.error('❌ Failed to start email worker:', error);
    process.exit(1);
  }
}

// Start the worker if this file is run directly
if (require.main === module) {
  startEmailWorker();
}

module.exports = { startEmailWorker };