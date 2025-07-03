#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Admin Security Validator');
console.log('============================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('💡 Copy .env.example to .env and configure your settings');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const envVars = {};

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key] = valueParts.join('=').replace(/"/g, '');
  }
});

// Validate admin configuration
let hasErrors = false;

console.log('📋 Checking Admin Configuration...\n');

// Check admin email
if (!envVars.ADMIN_EMAIL) {
  console.log('❌ ADMIN_EMAIL not configured');
  hasErrors = true;
} else {
  console.log(`✅ Admin Email: ${envVars.ADMIN_EMAIL}`);
}

// Check admin password hash
if (!envVars.ADMIN_PASSWORD_HASH) {
  console.log('❌ ADMIN_PASSWORD_HASH not configured');
  hasErrors = true;
} else {
  if (envVars.ADMIN_PASSWORD_HASH.length !== 64) {
    console.log('⚠️  ADMIN_PASSWORD_HASH should be 64 characters (SHA-256)');
    console.log(`   Current length: ${envVars.ADMIN_PASSWORD_HASH.length}`);
    hasErrors = true;
  } else {
    console.log('✅ Password hash is properly formatted');
  }
}

// Check database URL
if (!envVars.DATABASE_URL) {
  console.log('❌ DATABASE_URL not configured');
  hasErrors = true;
} else {
  console.log('✅ Database URL configured');
}

// Security recommendations
console.log('\n🔒 Security Recommendations:');
console.log('1. Use a strong, unique admin password');
console.log('2. Change default admin email for production');
console.log('3. Keep .env file out of version control');
console.log('4. Use HTTPS in production');
console.log('5. Regularly rotate admin credentials');

if (hasErrors) {
  console.log('\n❌ Configuration has issues. Please fix before deploying.');
  process.exit(1);
} else {
  console.log('\n✅ Admin configuration looks good!');
  console.log('🚀 Ready for deployment');
}