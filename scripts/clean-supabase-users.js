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

async function deleteAllUsers() {
  try {
    console.log('Fetching all users...');
    
    // Get all users using the admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('No users found to delete');
      return;
    }
    
    // Delete each user
    for (const user of users) {
      console.log(`Deleting user: ${user.email} (${user.id})`);
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error(`Error deleting user ${user.email}:`, deleteError);
      } else {
        console.log(`✓ Deleted user: ${user.email}`);
      }
    }
    
    console.log('✓ All users deleted successfully');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

deleteAllUsers();
