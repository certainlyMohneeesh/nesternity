#!/usr/bin/env node

/**
 * SUPABASE AUTH DIAGNOSTIC TOOL
 * 
 * This script provides detailed diagnostics of the Supabase Auth connection
 * and helps understand the exact structure of the API responses.
 */

// Load environment variables from .env.local if it exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=');
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
function createSupabaseAdminClient() {
  // Remove quotes if they exist in the environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^"(.*)"$/, '$1');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/^"(.*)"$/, '$1');
  
  console.log('Environment check:');
  console.log('- URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('- Service Key:', serviceRoleKey ? '✓ Set' : '✗ Missing');
  console.log('- Cleaned URL:', supabaseUrl);
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variables');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function diagnoseSupabase() {
  console.log('🔍 SUPABASE AUTH DIAGNOSTIC TOOL');
  console.log('================================\n');
  
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    
    console.log('1. Testing basic admin API access...');
    
    // Test 1: Try to list users with minimal parameters
    console.log('   Testing listUsers() with default parameters...');
    const { data: users1, error: error1 } = await supabaseAdmin.auth.admin.listUsers();
    
    console.log('   Raw response:');
    console.log('   - Data:', JSON.stringify(users1, null, 2));
    console.log('   - Error:', error1);
    console.log('   - Data type:', typeof users1);
    console.log('   - Is array:', Array.isArray(users1));
    if (users1) {
      console.log('   - Length:', users1.length);
    }
    console.log();
    
    // Test 2: Try with explicit pagination
    console.log('2. Testing with explicit pagination...');
    const { data: users2, error: error2 } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 10
    });
    
    console.log('   Raw response with pagination:');
    console.log('   - Data:', JSON.stringify(users2, null, 2));
    console.log('   - Error:', error2);
    console.log();
    
    // Test 3: Check if users property exists
    if (users1 && typeof users1 === 'object' && !Array.isArray(users1)) {
      console.log('3. Checking if response has nested users property...');
      console.log('   Available properties:', Object.keys(users1));
      
      if (users1.users) {
        console.log('   Found users property:', users1.users.length, 'users');
        console.log('   Sample user:', JSON.stringify(users1.users[0], null, 2));
      }
      
      if (users1.data) {
        console.log('   Found data property:', users1.data);
      }
      console.log();
    }
    
    // Test 4: Try to get user count or stats
    console.log('4. Testing user statistics...');
    try {
      // Some versions return paginated results with metadata
      const response = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log('   Total users found:', response.data.length);
          if (response.data.length > 0) {
            console.log('   First user structure:');
            const firstUser = response.data[0];
            console.log('   - ID:', firstUser.id);
            console.log('   - Email:', firstUser.email);
            console.log('   - Created:', firstUser.created_at);
            console.log('   - Metadata keys:', Object.keys(firstUser.user_metadata || {}));
            console.log('   - Full metadata:', JSON.stringify(firstUser.user_metadata, null, 2));
          }
        } else if (response.data.users) {
          console.log('   Users in nested property:', response.data.users.length);
        }
      }
    } catch (err) {
      console.log('   Error getting stats:', err.message);
    }
    console.log();
    
    // Test 5: Check authentication state
    console.log('5. Testing authentication state...');
    const { data: { session }, error: sessionError } = await supabaseAdmin.auth.getSession();
    console.log('   Session:', session ? 'Active' : 'None');
    console.log('   Session error:', sessionError);
    console.log();
    
    // Test 6: Check admin capabilities
    console.log('6. Testing admin capabilities...');
    try {
      // Try to create a test user (in dry-run mode)
      const testEmail = `test-${Date.now()}@example.com`;
      console.log(`   Testing user creation capability with: ${testEmail}`);
      
      const { data: createResult, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: 'temp-password-123',
        email_confirm: true
      });
      
      if (createError) {
        console.log('   Create user error:', createError.message);
        console.log('   This might indicate permission issues');
      } else {
        console.log('   ✅ User creation test successful');
        console.log('   Created user ID:', createResult.user?.id);
        
        // Clean up test user
        if (createResult.user?.id) {
          console.log('   Cleaning up test user...');
          await supabaseAdmin.auth.admin.deleteUser(createResult.user.id);
          console.log('   ✅ Test user cleaned up');
        }
      }
    } catch (err) {
      console.log('   Admin capability test failed:', err.message);
    }
    console.log();
    
    // Test 7: Check Supabase project status
    console.log('7. Final diagnosis...');
    if (!users1 || (Array.isArray(users1) && users1.length === 0)) {
      console.log('   📋 DIAGNOSIS: No users found in Supabase Auth');
      console.log('   This could mean:');
      console.log('   • No users have registered yet');
      console.log('   • Users exist but service role lacks permission');
      console.log('   • Wrong project URL or environment');
      console.log('   • Users might be in a different authentication provider');
    } else {
      console.log('   ✅ Users found successfully!');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run diagnostics
diagnoseSupabase().then(() => {
  console.log('\n🏁 Diagnostic complete!');
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
