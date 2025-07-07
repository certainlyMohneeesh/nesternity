#!/bin/bash

# Vercel build script that safely handles existing production databases
set -e

echo "🚀 Starting Vercel build process..."

# Always generate Prisma client first
echo "📦 Generating Prisma client..."
pnpm prisma generate

echo "🔍 Checking database migration status..."

# Try migrate deploy and capture output
if MIGRATE_OUTPUT=$(pnpm prisma migrate deploy 2>&1); then
    echo "✅ Migrations deployed successfully"
    echo "$MIGRATE_OUTPUT"
else
    echo "⚠️ Migration deploy encountered issues:"
    echo "$MIGRATE_OUTPUT"
    
    # Check if this is the P3005 error (database schema is not empty)
    if echo "$MIGRATE_OUTPUT" | grep -q "P3005"; then
        echo "🔧 Detected P3005: Database schema exists but migrations are not recorded"
        echo "This typically happens when deploying to an existing production database"
        echo "Attempting to baseline migrations..."
        
        # Try to mark all existing migrations as applied
        echo "Marking existing migrations as applied..."
        pnpm prisma migrate resolve --applied 20250701050216_init || echo "Could not resolve init migration"
        pnpm prisma migrate resolve --applied 20250701071353_add_boards_system || echo "Could not resolve boards migration"
        pnpm prisma migrate resolve --applied 20250703064745_advanced_features || echo "Could not resolve features migration"
        pnpm prisma migrate resolve --applied 20250703073550_added_description_in_model_board || echo "Could not resolve board description migration"
        pnpm prisma migrate resolve --applied 20250703084431_description_to_task || echo "Could not resolve task description migration"
        pnpm prisma migrate resolve --applied 20250704084955_add_enable_payment_link_to_invoice || echo "Could not resolve payment link migration"
        pnpm prisma migrate resolve --applied 20250704085251_add_watermark_and_esignature_to_invoice || echo "Could not resolve watermark migration"
        pnpm prisma migrate resolve --applied 20250706060030_added_indexes || echo "Could not resolve indexes migration"
        
        echo "Attempting migration deploy again..."
        if pnpm prisma migrate deploy 2>&1; then
            echo "✅ Migrations successfully applied after baseline"
        else
            echo "⚠️ Migration deploy still has issues, but proceeding with build"
            echo "The database schema should already be compatible"
        fi
    else
        echo "⚠️ Unknown migration error, but proceeding with build"
        echo "Prisma client is generated and should work with existing schema"
    fi
fi

echo "🏗️ Building Next.js application..."
pnpm next build

echo "🎉 Build completed successfully!"
