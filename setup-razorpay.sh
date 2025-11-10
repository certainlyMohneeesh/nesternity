#!/bin/bash

# Razorpay Integration Setup Script
# This script helps set up the Razorpay integration for Nesternity

set -e  # Exit on error

echo "🚀 Razorpay Integration Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from .env.example...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo -e "${YELLOW}⚠️  Please update .env.local with your actual credentials${NC}"
    echo ""
fi

# Check for Razorpay credentials
echo "🔍 Checking Razorpay configuration..."
if grep -q "RAZORPAY_KEY_ID=rzp_test_" .env.local; then
    echo -e "${YELLOW}⚠️  Using test Razorpay credentials${NC}"
    echo -e "${YELLOW}   For production, replace with live credentials (rzp_live_)${NC}"
else
    echo -e "${GREEN}✅ Razorpay credentials configured${NC}"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ pnpm not found. Please install pnpm first:${NC}"
    echo "   npm install -g pnpm"
    exit 1
fi
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
read -p "Do you want to run migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ "$NODE_ENV" = "production" ]; then
        pnpm prisma migrate deploy
    else
        pnpm prisma migrate dev --name add_razorpay_integration
    fi
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping migrations. Run manually with:${NC}"
    echo "   pnpm prisma migrate dev --name add_razorpay_integration"
fi
echo ""

# Check database connection
echo "🔌 Checking database connection..."
if pnpm prisma db push --skip-generate --accept-data-loss &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}   Please check your DATABASE_URL in .env.local${NC}"
fi
echo ""

# Build the application
echo "🏗️  Building application..."
read -p "Do you want to build the application now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm build:local
    echo -e "${GREEN}✅ Application built successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping build. Run manually with:${NC}"
    echo "   pnpm build:local"
fi
echo ""

# Setup instructions
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Configure Razorpay Credentials:"
echo "   - Visit https://dashboard.razorpay.com/app/keys"
echo "   - Copy your Key ID and Key Secret"
echo "   - Update .env.local with these values"
echo ""
echo "2. Set up Webhook:"
echo "   - Visit https://dashboard.razorpay.com/app/webhooks"
echo "   - Add webhook URL: https://yourdomain.com/api/razorpay/webhook"
echo "   - Enable events: payment_link.paid, payment_link.cancelled, payment_link.expired"
echo "   - Copy the Webhook Secret to .env.local"
echo ""
echo "3. Configure User Payment Settings:"
echo "   - Start the application: pnpm dev"
echo "   - Navigate to Settings → Payments"
echo "   - Add your Razorpay credentials and bank details"
echo ""
echo "4. Test Payment Link Generation:"
echo "   - Create a new invoice with 'Enable Payment Link' checked"
echo "   - Verify the Razorpay payment link is generated"
echo "   - Test payment using Razorpay test cards"
echo ""
echo "5. Local Webhook Testing (Optional):"
echo "   - Install ngrok: npm install -g ngrok"
echo "   - Run: ngrok http 3000"
echo "   - Use the HTTPS URL in Razorpay webhook configuration"
echo ""
echo "📚 Documentation:"
echo "   - Complete Guide: ./RAZORPAY_INTEGRATION_GUIDE.md"
echo "   - Implementation Summary: ./RAZORPAY_IMPLEMENTATION_SUMMARY.md"
echo "   - Tests: ./__tests__/razorpay.test.ts"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "🚀 Start the development server with:"
echo "   pnpm dev"
echo ""
