import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials, createAdminSession } from '@/middleware/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔍 Admin login attempt:', { email, password: '***' });
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const isValid = verifyAdminCredentials(email, password);
    console.log('✅ Credential verification result:', isValid);

    if (isValid) {
      const sessionData = createAdminSession()
      console.log('✅ Creating session:', sessionData);
      
      const response = NextResponse.json({ success: true })
      
      // Set secure cookie for admin session
      response.cookies.set('admin-auth', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 4 * 60 * 60, // 4 hours
        path: '/',
        sameSite: 'lax'
      })
      
      console.log('✅ Admin login successful');
      return response
    } else {
      console.log('❌ Invalid credentials provided');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin-auth')
  return response
}