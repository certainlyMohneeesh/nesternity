import { NextRequest, NextResponse } from 'next/server'

// Admin credentials from environment variables (required)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

// Validate that admin credentials are properly configured
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    'Admin credentials not configured! Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file.'
  )
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  if (!email || !password) {
    console.log('❌ Missing email or password in verification');
    return false;
  }
  
  console.log('🔍 Verifying credentials:', { 
    email, 
    password: '***',
    expectedEmail: ADMIN_EMAIL,
    expectedPassword: '***',
    emailMatch: email === ADMIN_EMAIL,
    passwordMatch: password === ADMIN_PASSWORD
  });
  
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin-auth')
  if (!authCookie) return false
  
  try {
    const { email, timestamp } = JSON.parse(authCookie.value)
    // Session expires after 4 hours
    const isExpired = Date.now() - timestamp > 4 * 60 * 60 * 1000
    return email === ADMIN_EMAIL && !isExpired
  } catch {
    return false
  }
}

export function createAdminSession(): string {
  if (!ADMIN_EMAIL) {
    throw new Error('Admin email not configured')
  }
  
  return JSON.stringify({
    email: ADMIN_EMAIL,
    timestamp: Date.now()
  })
}