#!/bin/bash

echo "🚀 Nesternity Clean Migration Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate

echo -e "${YELLOW}🗃️ Running database migration...${NC}"
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migration successful!${NC}"
    
    echo -e "${YELLOW}🌟 Starting development server...${NC}"
    echo -e "${GREEN}🎉 Setup complete! Your clean Nesternity is ready!${NC}"
    echo ""
    echo "🔗 Open: http://localhost:3000"
    echo "🔍 Database Studio: npx prisma studio"
    echo "📊 View logs: Check terminal for any errors"
    echo ""
    
    npm run dev
else
    echo -e "${RED}❌ Database migration failed${NC}"
    echo "Please check your DATABASE_URL in .env.local"
    echo ""
    echo "Quick setup options:"
    echo "1. Neon: https://console.neon.tech/"
    echo "2. Railway: https://railway.app/"
    echo "3. Local: sudo apt install postgresql postgresql-contrib"
    echo ""
    echo "See MIGRATION_COMPLETE.md for detailed instructions"
fi
