/**
 * Test script for Google Sheets API integration
 * Run with: node test-sheets-api.js
 */

const { google } = require('googleapis');
const crypto = require('crypto');
const path = require('path');

async function testGoogleSheetsAPI() {
  try {
    console.log('🧪 Testing Google Sheets API integration...\n');

    // Check if credentials file exists
    const credentialsPath = path.join(__dirname, 'src/app/api/admin/download-logs/credentials.json');
    console.log('📁 Credentials path:', credentialsPath);
    
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Test sheet ID (you'll need to update this)
    const SHEET_ID = process.env.GOOGLE_SHEET_ID || 'YOUR_SHEET_ID_HERE';
    
    if (SHEET_ID === 'YOUR_SHEET_ID_HERE') {
      console.log('❌ Please set GOOGLE_SHEET_ID environment variable');
      return;
    }

    console.log('📊 Sheet ID:', SHEET_ID);

    // Test reading the sheet
    console.log('\n📖 Testing read access...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:B',
    });

    console.log('✅ Read test successful!');
    console.log('📋 Current rows:', response.data.values?.length || 0);
    
    // Test adding a row (with test data)
    console.log('\n✍️  Testing write access...');
    const testEmail = `test-${crypto.randomUUID()}@example.com`;
    const testDate = new Date().toISOString();
    
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:B',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[testEmail, testDate]],
      },
    });

    console.log('✅ Write test successful!');
    console.log('📝 Added test entry:', testEmail);
    console.log('\n🎉 Google Sheets API integration is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ENOENT')) {
      console.log('\n💡 Tip: Make sure the credentials.json file exists');
    } else if (error.message.includes('403')) {
      console.log('\n💡 Tip: Make sure the service account has access to the sheet');
    } else if (error.message.includes('404')) {
      console.log('\n💡 Tip: Check that the GOOGLE_SHEET_ID is correct');
    }
  }
}

// Run the test
testGoogleSheetsAPI();
