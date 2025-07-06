import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Sheets configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE = 'Sheet1!A:B'; // Assuming columns A (Email) and B (Subscribed At)

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

async function addToGoogleSheets(email: string, subscribedAt: string) {
  try {
    // Get credentials from environment variables
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_CERT_URL,
      universe_domain: "googleapis.com"
    };

    // Validate required credentials
    if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
      throw new Error('Missing required Google Cloud credentials in environment variables');
    }
    
    // Initialize Google Sheets API with credentials object
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Check if email already exists
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = existingData.data.values || [];
    const emailExists = rows.some(row => row[0] && row[0].toLowerCase() === email.toLowerCase());

    if (emailExists) {
      throw new Error('Email already subscribed');
    }

    // Add new row
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[email, subscribedAt]],
      },
    });

    console.log('Successfully added email to Google Sheets:', {
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2'), // Partially mask email for privacy
      timestamp: subscribedAt
    });

    return response.data;
  } catch (error) {
    console.error('Google Sheets API error:', error);
    throw error;
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

    // Check if Google Sheets is configured
    if (!SHEET_ID) {
      return NextResponse.json(
        { error: 'Google Sheets not configured' },
        { status: 500 }
      );
    }

    // Add to Google Sheets
    const subscribedAt = new Date().toISOString();
    await addToGoogleSheets(email, subscribedAt);

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter! 🎉' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Newsletter API error:', error);
    
    if (error.message === 'Email already subscribed') {
      return NextResponse.json(
        { error: 'This email is already subscribed to our newsletter' },
        { status: 409 }
      );
    }

    if (error.message?.includes('Missing required Google Cloud credentials')) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}