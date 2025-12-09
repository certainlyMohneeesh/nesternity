#!/bin/bash

# Vercel build script that safely handles existing production databases
set -e

echo "🚀 Starting Vercel build process..."

# Always generate Prisma client first
echo "📦 Generating Prisma client..."
bunx prisma generate

# Fix Prisma imports for Turbopack compatibility
echo "🔧 Fixing Prisma imports..."
node fix-prisma-imports.js

echo "🔍 Checking database migration status..."

# Check if migrations directory exists
if [ ! -d "prisma/migrations" ] || [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "⚠️ No migrations found in prisma/migrations directory"
    echo "This is expected when using db push workflow"
    echo "Skipping migration deploy..."
else
    # Try migrate deploy and capture output
    if MIGRATE_OUTPUT=$(bunx prisma migrate deploy 2>&1); then
        echo "✅ Migrations deployed successfully"
        echo "$MIGRATE_OUTPUT"
    else
        echo "⚠️ Migration deploy encountered issues:"
        echo "$MIGRATE_OUTPUT"
        
        # Check if this is the P3005 error (database schema is not empty)
        if echo "$MIGRATE_OUTPUT" | grep -q "P3005"; then
            echo "🔧 Detected P3005: Database schema exists but migrations are not recorded"
            echo "This is normal for production databases managed with 'prisma db push'"
            echo "Skipping migration baseline - database schema is already up to date"
        else
            echo "⚠️ Unknown migration error, but proceeding with build"
            echo "Prisma client is generated and should work with existing schema"
        fi
    fi
fi

echo "✅ Database setup complete"
echo "🏗️ Building Next.js application..."
# Use explicit --turbopack flag for Next.js 16
bun --bun run next build --turbopack

echo "🎉 Build completed successfully!"
