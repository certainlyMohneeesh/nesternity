import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

// Google Sheets configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID; // You'll need to add this to your .env file
const RANGE = 'Sheet1!A:B'; // Assuming columns A (Email) and B (Subscribed At)

// reCAPTCHA configuration
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY; // You'll need to add this to your .env file

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error('RECAPTCHA_SECRET_KEY not configured');
    return false;
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
    return data.success && data.score > 0.5; // For reCAPTCHA v3, check score
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
}

async function addToGoogleSheets(email: string, subscribedAt: string) {
  try {
    // Path to credentials file
    const credentialsPath = path.join(process.cwd(), 'src/app/api/admin/download-logs/credentials.json');
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
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

    // Verify reCAPTCHA
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
    if (!isValidRecaptcha) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed' },
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
      { message: 'Successfully subscribed to newsletter!' },
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

    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}
