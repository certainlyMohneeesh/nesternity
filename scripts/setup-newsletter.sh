#!/bin/bash

echo "🚀 Setting up Newsletter/Waitlist Integration"
echo "=============================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📁 Creating .env file..."
    touch .env
fi

echo "📋 Current environment variables:"
echo ""
grep -E "(GOOGLE_SHEET_ID|RECAPTCHA)" .env 2>/dev/null || echo "No newsletter environment variables found"
echo ""

echo "📝 To complete the setup, add these variables to your .env file:"
echo ""
echo "# Google Sheets Configuration"
echo "GOOGLE_SHEET_ID=your_google_sheet_id_here"
echo ""
echo "# reCAPTCHA Configuration"
echo "RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here"
echo "NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here"
echo ""

echo "📖 For detailed setup instructions, see: NEWSLETTER_SETUP.md"
echo ""

echo "🧪 To test the Google Sheets API integration:"
echo "GOOGLE_SHEET_ID=your_sheet_id node test-sheets-api.js"
echo ""

echo "✅ Setup script completed!"
echo "Next steps:"
echo "1. Follow the instructions in NEWSLETTER_SETUP.md"
echo "2. Add the environment variables to your .env file"
echo "3. Run 'npm run dev' to start the development server"
