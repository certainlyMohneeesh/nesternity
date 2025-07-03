// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Read .env file
try {
  const envPath = path.join(__dirname, '..', '.env');
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
} catch (error) {
  console.error('Error loading .env file:', error.message);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserIds() {
  try {
    console.log('🔄 Updating user IDs to match Supabase...');

    // Update the user ID to match the one created in Supabase
    const newUserId = '92fe8256-bee8-4794-b72a-653cd0673da6';
    const oldUserId = 'test-user-id-123';

    // Update user
    await prisma.user.update({
      where: { id: oldUserId },
      data: { id: newUserId }
    });
    console.log('✓ Updated user ID');

    // Update team
    await prisma.team.updateMany({
      where: { createdBy: oldUserId },
      data: { createdBy: newUserId }
    });
    console.log('✓ Updated team creator');

    // Update team member
    await prisma.teamMember.updateMany({
      where: { userId: oldUserId },
      data: { userId: newUserId }
    });
    console.log('✓ Updated team member');

    // Update tasks
    await prisma.task.updateMany({
      where: { createdBy: oldUserId },
      data: { createdBy: newUserId }
    });
    console.log('✓ Updated task creator');

    // Update client
    await prisma.client.updateMany({
      where: { createdBy: oldUserId },
      data: { createdBy: newUserId }
    });
    console.log('✓ Updated client creator');

    console.log('🎉 All user IDs updated successfully!');
    console.log(`✓ New user ID: ${newUserId}`);

  } catch (error) {
    console.error('❌ Error updating user IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserIds();
