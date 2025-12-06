#!/bin/bash

# Nesternity CRM Database Setup Script
# This script sets up the required database tables and RLS policies

echo "🚀 Setting up Nesternity CRM Database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Creating required database tables and policies..."

# Run the SQL files
echo "   Creating team invites table..."
supabase db push --file sql/pending_invites.sql

echo "   Creating notifications and activities tables..."
supabase db push --file sql/notifications.sql

echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update your .env.local file with Supabase credentials"
echo "   2. Run 'bun install' to install dependencies"
echo "   3. Run 'bun run dev' to start the development server"
echo ""
echo "🎉 Your Nesternity CRM is ready to use!"
