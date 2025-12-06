#!/bin/bash

# Reset and Migrate Database for Razorpay Route Integration
# This script will:
# 1. Delete all existing migrations (fresh start)
# 2. Create a new initial migration
# 3. Apply it to the database

set -e

echo "🚀 Starting Fresh Database Migration for Razorpay Route..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Backup current migrations (optional)
echo -e "${YELLOW}📦 Creating backup of existing migrations...${NC}"
if [ -d "prisma/migrations" ]; then
  BACKUP_DIR="prisma/migrations_backup_$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  cp -r prisma/migrations/* "$BACKUP_DIR/" 2>/dev/null || true
  echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
fi
echo ""

# Step 2: Remove old migrations
echo -e "${YELLOW}🗑️  Removing old migrations...${NC}"
rm -rf prisma/migrations
echo -e "${GREEN}✓ Old migrations removed${NC}"
echo ""

# Step 3: Validate schema
echo -e "${YELLOW}🔍 Validating Prisma schema...${NC}"
bunx prisma validate
echo -e "${GREEN}✓ Schema is valid${NC}"
echo ""

# Step 4: Generate Prisma Client
echo -e "${YELLOW}⚙️  Generating Prisma Client...${NC}"
bunx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Step 5: Create fresh migration
echo -e "${YELLOW}📝 Creating fresh migration with Razorpay Route...${NC}"
bunx prisma migrate dev --name initial_with_razorpay_route
echo -e "${GREEN}✓ Migration created and applied${NC}"
echo ""

echo -e "${GREEN}✨ Database reset complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your .env with Supabase credentials"
echo "2. Start the dev server: pnpm dev"
echo "3. Go to Settings → Payments to link your bank account"
echo ""
