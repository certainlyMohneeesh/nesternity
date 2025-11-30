import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// reCAPTCHA configuration
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

async function verifyRecaptcha(token: string, action: string = 'newsletter_signup'): Promise<boolean> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error('RECAPTCHA_SECRET_KEY not configured');
    return false;
  }

  // Skip reCAPTCHA verification in development if using invalid keys
  if (process.env.NODE_ENV === 'development' && RECAPTCHA_SECRET_KEY.includes('INVALID')) {
    console.log('Development mode: skipping reCAPTCHA verification');
    return true;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();
    console.log('reCAPTCHA v3 verification result:', {
      success: data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname
    });

    // For reCAPTCHA v3: check success, score, and action
    return data.success &&
      data.score >= 0.5 &&
      data.action === action;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, recaptchaToken } = await request.json();

    // Validate input
    if (!email || !recaptchaToken) {
      return NextResponse.json(
        { error: 'Email and reCAPTCHA token are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA v3
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken, 'newsletter_signup');
    if (!isValidRecaptcha) {
      return NextResponse.json(
        { error: 'Security verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingSubscriber = await db.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingSubscriber) {
      // If previously unsubscribed, reactivate
      if (existingSubscriber.status === 'unsubscribed') {
        await db.newsletterSubscriber.update({
          where: { email: email.toLowerCase() },
          data: {
            status: 'active',
            subscribedAt: new Date(),
            unsubscribedAt: null
          }
        });

        return NextResponse.json(
          { message: 'Welcome back! You\'ve been re-subscribed to our newsletter! 🎉' },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'This email is already subscribed to our newsletter' },
        { status: 409 }
      );
    }

    // Add new subscriber
    await db.newsletterSubscriber.create({
      data: {
        email: email.toLowerCase(),
        status: 'active'
      }
    });

    console.log('New newsletter subscriber:', {
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2') // Partially mask for privacy
    });

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter! 🎉' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Newsletter subscription error:', error);

    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}