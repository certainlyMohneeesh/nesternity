#!/bin/bash

# Fresh Start for Supabase with Razorpay Route
# This script safely resets only the public schema (not auth)

set -e

echo "🚀 Fresh Database Setup for Razorpay Route Integration"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  WARNING: This will DELETE ALL DATA in the public schema!${NC}"
echo -e "${YELLOW}   (Supabase auth schema will NOT be affected)${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 1: Dropping all tables in public schema...${NC}"

# SQL to drop all tables in public schema only
cat > /tmp/drop_public_schema.sql << 'EOF'
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all enums in public schema
    FOR r IN (SELECT t.typname as enumname
              FROM pg_type t 
              JOIN pg_enum e ON t.oid = e.enumtypid  
              JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
              WHERE n.nspname = 'public'
              GROUP BY t.typname) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.enumname) || ' CASCADE';
    END LOOP;
END $$;
EOF

# Execute the SQL
if [ -f ".env" ]; then
  source .env
  PGPASSWORD="${DATABASE_URL#*:*@*/*/*}" psql "${DIRECT_URL}" -f /tmp/drop_public_schema.sql 2>/dev/null || true
fi

rm /tmp/drop_public_schema.sql

echo -e "${GREEN}✓ Public schema cleared${NC}"
echo ""

# Remove old migrations
echo -e "${YELLOW}📋 Step 2: Removing old migrations...${NC}"
rm -rf prisma/migrations
echo -e "${GREEN}✓ Migrations removed${NC}"
echo ""

# Validate schema
echo -e "${YELLOW}📋 Step 3: Validating schema...${NC}"
pnpm prisma validate
echo -e "${GREEN}✓ Schema valid${NC}"
echo ""

# Generate Prisma Client
echo -e "${YELLOW}📋 Step 4: Generating Prisma Client...${NC}"
pnpm prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Create and apply migration
echo -e "${YELLOW}📋 Step 5: Creating fresh migration...${NC}"
pnpm prisma migrate dev --name initial_razorpay_route
echo -e "${GREEN}✓ Migration applied${NC}"
echo ""

echo -e "${GREEN}✨ SUCCESS! Fresh database ready with Razorpay Route!${NC}"
echo ""
echo "Next steps:"
echo "1. Start dev server: pnpm dev"
echo "2. Sign up for a new account"
echo "3. Go to Settings → Payments"  
echo "4. Link your bank account (no API keys needed!)"
echo "5. Create an invoice with payment link"
echo ""
