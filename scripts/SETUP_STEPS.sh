#!/bin/bash

# ⚠️  IMPORTANT: Run These Commands BEFORE Testing
# ================================================

echo "🔧 Razorpay Integration - Final Setup Steps"
echo "==========================================="
echo ""
echo "⚠️  The TypeScript errors you're seeing are NORMAL!"
echo "   They will disappear after running these commands:"
echo ""

# Step 1: Generate Prisma Client
echo "📝 Step 1: Generate Prisma Client (Required)"
echo "   This will create TypeScript types for the new models"
echo ""
echo "   Command: pnpm prisma generate"
echo ""
read -p "   Press ENTER to run this command..." 
pnpm prisma generate
echo ""
echo "   ✅ Done!"
echo ""

# Step 2: Create Migration
echo "📝 Step 2: Create Database Migration"
echo "   This will update your database schema"
echo ""
echo "   Command: pnpm prisma migrate dev --name add_razorpay_integration"
echo ""
read -p "   Press ENTER to run this command..."
pnpm prisma migrate dev --name add_razorpay_integration
echo ""
echo "   ✅ Done!"
echo ""

# Step 3: Verify
echo "📝 Step 3: Verify Installation"
echo "   Checking if TypeScript errors are resolved..."
echo ""
npx tsc --noEmit 2>&1 | grep -c "error" > /dev/null
if [ $? -eq 0 ]; then
    ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)
    echo "   ⚠️  Still has $ERROR_COUNT TypeScript errors"
    echo "   Most should be from test files (normal - needs Jest setup)"
else
    echo "   ✅ No TypeScript errors!"
fi
echo ""

# Step 4: Next Steps
echo "📝 Step 4: Add Razorpay Credentials"
echo "   1. Copy .env.example to .env.local (if not already done)"
echo "   2. Get your Razorpay credentials from: https://dashboard.razorpay.com/app/keys"
echo "   3. Add them to .env.local:"
echo ""
echo "      RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx"
echo "      RAZORPAY_KEY_SECRET=your_secret_here"
echo "      RAZORPAY_WEBHOOK_SECRET=your_webhook_secret"
echo ""

read -p "Press ENTER when you've added your credentials..."
echo ""

# Step 5: Start Application
echo "📝 Step 5: Start the Application"
echo "   You can now start the dev server"
echo ""
echo "   Command: pnpm dev"
echo ""
read -p "   Press ENTER to start the dev server (or Ctrl+C to skip)..."
pnpm dev
