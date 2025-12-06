#!/bin/bash

# COMPLETE FRESH START - Drops everything including auth
# WARNING: This will delete ALL users and data!

set -e

echo "⚠️  ⚠️  ⚠️  COMPLETE DATABASE RESET ⚠️  ⚠️  ⚠️"
echo ""
echo "This will:"
echo "  - Delete ALL tables in public schema"
echo "  - Delete ALL auth users and sessions"
echo "  - Delete ALL data (no recovery possible)"
echo "  - Create fresh migrations"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}Type 'DELETE EVERYTHING' to confirm:${NC}"
read -r confirmation

if [ "$confirmation" != "DELETE EVERYTHING" ]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo -e "${YELLOW}🗑️  Step 1: Executing database reset SQL...${NC}"

# Check if .env exists and load it
if [ ! -f ".env" ]; then
  echo -e "${RED}Error: .env file not found!${NC}"
  echo "Please create .env with your Supabase credentials:"
  echo "  DATABASE_URL=..."
  echo "  DIRECT_URL=..."
  exit 1
fi

# Extract DIRECT_URL from .env
DIRECT_URL=$(grep "^DIRECT_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DIRECT_URL" ]; then
  echo -e "${RED}Error: DIRECT_URL not found in .env${NC}"
  exit 1
fi

# Run the reset SQL
echo "Connecting to database..."
psql "$DIRECT_URL" -f reset-database-complete.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database wiped clean${NC}"
else
  echo -e "${RED}✗ Database reset failed${NC}"
  echo "You may need to run this SQL manually in Supabase SQL Editor:"
  echo ""
  cat reset-database-complete.sql
  exit 1
fi

echo ""
echo -e "${YELLOW}🗑️  Step 2: Removing old migrations...${NC}"
rm -rf prisma/migrations
mkdir -p prisma/migrations
echo -e "${GREEN}✓ Migrations cleared${NC}"

echo ""
echo -e "${YELLOW}🔍 Step 3: Validating schema...${NC}"
bunx prisma validate
echo -e "${GREEN}✓ Schema valid${NC}"

echo ""
echo -e "${YELLOW}⚙️  Step 4: Generating Prisma Client...${NC}"
bunx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

echo ""
echo -e "${YELLOW}📝 Step 5: Creating initial migration...${NC}"
bunx prisma migrate dev --name initial_razorpay_route

echo ""
echo -e "${GREEN}✨ ✨ ✨  COMPLETE FRESH START SUCCESSFUL! ✨ ✨ ✨${NC}"
echo ""
echo "Your database is now completely empty with fresh schema."
echo ""
echo "Next steps:"
echo "  1. Start dev server: ${GREEN}bun run dev${NC}"
echo "  2. Go to http://localhost:3000"
echo "  3. Sign up for a NEW account (old users deleted)"
echo "  4. Go to Settings → Payments"
echo "  5. Link your bank account (no API keys!)"
echo "  6. Create invoice with Razorpay payment link"
echo ""
