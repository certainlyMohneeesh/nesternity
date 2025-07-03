// Debug script to test admin credentials
const fs = require('fs');
const path = require('path');

// Read .env file manually
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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

console.log('🔍 Debug Admin Credentials:');
console.log('ADMIN_EMAIL from env:', ADMIN_EMAIL);
console.log('ADMIN_PASSWORD from env:', ADMIN_PASSWORD);
console.log('ADMIN_EMAIL type:', typeof ADMIN_EMAIL);
console.log('ADMIN_PASSWORD type:', typeof ADMIN_PASSWORD);

// Test credentials
const testEmail = 'admin@nesternity.com';
const testPassword = 'admin123!@#';

console.log('\n🧪 Testing credentials:');
console.log('Test email:', testEmail);
console.log('Test password:', testPassword);
console.log('Email match:', testEmail === ADMIN_EMAIL);
console.log('Password match:', testPassword === ADMIN_PASSWORD);

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Admin credentials not configured properly!');
} else {
  console.log('✅ Admin credentials are configured');
}
