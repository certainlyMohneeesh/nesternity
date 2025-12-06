#!/bin/bash

echo "🚀 Nesternity Setup Script"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo "Please create .env.local with your database connection string"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env.local; then
    echo -e "${RED}❌ DATABASE_URL not found in .env.local${NC}"
    echo "Please add your PostgreSQL connection string to .env.local"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
bun install

echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
bunx prisma generate

echo -e "${BLUE}🗄️ Running database migrations...${NC}"
bunx prisma migrate dev --name setup

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database setup successful!${NC}"
    
    echo -e "${YELLOW}🌟 Starting development server...${NC}"
    echo -e "${GREEN}🎉 Setup complete! Your Nesternity is ready!${NC}"
    echo ""
    echo "🔗 Open: http://localhost:3000"
    echo "🔍 Database Studio: npx prisma studio"
    echo "📊 Admin Dashboard: http://localhost:3000/admin"
    echo ""
    echo "💡 Development Tips:"
    echo "• bun run dev          - Start development server (fast)"
    echo "• bun run prisma:studio - Database GUI"
    echo "• bun run prisma:dev   - Run new migrations"
    echo ""
    
    bun run dev
else
    echo -e "${RED}❌ Database setup failed${NC}"
    echo "Please check your DATABASE_URL in .env.local"
    echo ""
    echo "Quick setup options:"
    echo "1. Neon: https://console.neon.tech/"
    echo "2. Railway: https://railway.app/"
    echo "3. Supabase: https://supabase.com/dashboard"
    echo ""
    echo "See STRIPE_SETUP.md for payment configuration"
fi
