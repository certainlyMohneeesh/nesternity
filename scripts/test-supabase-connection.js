#!/usr/bin/env node

/**
 * Test Supabase Auth Connection
 * This script tests the connection to Supabase Auth and lists basic info
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Read .env file
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
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
  }
} catch (error) {
  console.log('Warning: Could not load .env file:', error.message);
}

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Auth connection...\n');
  
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment variables:');
    console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}`);
    console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✓ Set' : '✗ Missing'}`);
    console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? '✓ Set' : '✗ Missing'}\n`);
    
    if (!supabaseUrl) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL is required');
      return;
    }
    
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
      return;
    }
    
    // Test with service role key (admin)
    console.log('Testing admin connection...');
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Try to get the first page of users
    console.log('Fetching users from Supabase Auth...');
    const { data: users, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 10
    });
    
    if (error) {
      console.error('❌ Admin API error:', error.message);
      console.error('Full error:', error);
      return;
    }
    
    console.log(`✅ Successfully connected to Supabase Auth`);
    console.log(`📊 Found ${users ? users.length : 0} users in the first page`);
    
    if (users && users.length > 0) {
      console.log('\nSample users:');
      users.slice(0, 3).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.id})`);
        console.log(`     Created: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log(`     Metadata: ${JSON.stringify(user.user_metadata || {}, null, 2)}`);
      });
    } else {
      console.log('\n⚠️  No users found in Supabase Auth');
      console.log('   This could mean:');
      console.log('   1. No users have signed up yet');
      console.log('   2. Users are in a different project/environment');
      console.log('   3. The service role key doesn\'t have access to this data');
    }
    
    // Test regular client connection
    if (anonKey) {
      console.log('\nTesting regular client connection...');
      const regularClient = createClient(supabaseUrl, anonKey);
      
      const { data: session } = await regularClient.auth.getSession();
      console.log(`📱 Regular client session: ${session.session ? '✓ Active' : '✗ No session'}`);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Full error:', error);
    if (error.message.includes('Invalid API key')) {
      console.log('\n💡 Tip: Check that your SUPABASE_SERVICE_ROLE_KEY is correct');
    }
  }
}

if (require.main === module) {
  testSupabaseConnection();
}

module.exports = { testSupabaseConnection };
