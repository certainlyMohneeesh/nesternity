export function validateEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ All required environment variables are present');
}

export function logEnvironmentInfo() {
  console.log('🔧 Environment Info:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- DATABASE_URL present:', !!process.env.DATABASE_URL);
  console.log('- SUPABASE_URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('- SUPABASE_ANON_KEY present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log('- VERCEL:', process.env.VERCEL);
  console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
}