const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTestUser() {
  try {
    console.log('Creating test user in Supabase Auth...');
    
    // Create user with specific ID to match our database
    const { data, error } = await supabase.auth.admin.createUser({
      user_id: 'test-user-id-123',
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        display_name: 'Test User'
      }
    });
    
    if (error) {
      console.error('Error creating user:', error);
      return;
    }
    
    console.log('✓ Test user created successfully:', data.user.email);
    console.log('✓ User ID:', data.user.id);
    console.log('\n🔑 Test Login Credentials:');
    console.log('Email: test@example.com');
    console.log('Password: testpassword123');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

createTestUser();
