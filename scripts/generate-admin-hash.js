#!/usr/bin/env node

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Admin Password Hash Generator');
console.log('=====================================\n');

rl.question('Enter the admin password: ', (password) => {
  if (!password) {
    console.log('❌ Password cannot be empty');
    rl.close();
    return;
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  
  console.log('\n✅ Password hash generated successfully!');
  console.log('=====================================');
  console.log(`Password Hash: ${hash}`);
  console.log('\n📋 Add this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
  console.log('\n🔒 Keep this hash secure and never share it!');
  
  rl.close();
});

rl.on('close', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});