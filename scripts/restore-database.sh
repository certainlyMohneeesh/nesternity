#!/bin/bash

# Database Restore Script for Supabase
# This script restores a backup of your Supabase PostgreSQL database

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified"
    echo ""
    echo "Usage: ./scripts/restore-database.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/*.sql 2>/dev/null || echo "   No backups found in backups/ directory"
    echo ""
    echo "Example:"
    echo "   ./scripts/restore-database.sh backups/backup_20251112_230509.sql"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$DIRECT_URL" ]; then
    echo "❌ Error: DIRECT_URL not found in .env file"
    exit 1
fi

# Parse connection details
DB_USER="postgres.scmyzihaokadwwszaimd"
DB_PASSWORD="l3Z3enEzZq0yGwyj"
DB_HOST="aws-1-ap-south-1.pooler.supabase.com"
DB_PORT="5432"
DB_NAME="postgres"

echo "⚠️  DATABASE RESTORE WARNING"
echo "=" | head -c 80 | tr -d '\n'; echo ""
echo ""
echo "This will COMPLETELY REPLACE your current database with the backup!"
echo ""
echo "📁 Backup file: $BACKUP_FILE"
echo "📊 Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "⚠️  ALL CURRENT DATA WILL BE LOST!"
echo ""
echo "=" | head -c 80 | tr -d '\n'; echo ""
echo ""

# Ask for confirmation
read -p "Are you ABSOLUTELY SURE you want to continue? (type 'yes' to proceed): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo "❌ Restore cancelled"
    exit 0
fi

echo ""
echo "🔄 Starting database restore..."
echo ""

# Create a safety backup first
SAFETY_BACKUP="backups/pre-restore-backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p backups

echo "📦 Creating safety backup before restore..."
export PGPASSWORD="$DB_PASSWORD"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-acl --clean --if-exists \
    -f "$SAFETY_BACKUP" 2>&1 | grep -v "^pg_dump:" || true

if [ $? -eq 0 ]; then
    SAFETY_SIZE=$(du -h "$SAFETY_BACKUP" | cut -f1)
    echo "✅ Safety backup created: $SAFETY_BACKUP ($SAFETY_SIZE)"
else
    echo "⚠️  Warning: Could not create safety backup"
    read -p "Continue anyway? (type 'yes'): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo "❌ Restore cancelled"
        unset PGPASSWORD
        exit 1
    fi
fi

echo ""
echo "🔄 Restoring from backup..."
echo "   This may take a few minutes..."
echo ""

# Restore the backup
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f "$BACKUP_FILE" 2>&1 | grep -E "(^ERROR|^FATAL|creating|dropping)" || true

RESTORE_EXIT_CODE=$?

# Unset password
unset PGPASSWORD

echo ""

if [ $RESTORE_EXIT_CODE -eq 0 ]; then
    echo "✅ Database restored successfully!"
    echo ""
    echo "📊 Summary:"
    echo "   Backup file: $BACKUP_FILE"
    echo "   Safety backup: $SAFETY_BACKUP"
    echo ""
    echo "🔍 Next steps:"
    echo "   1. Verify data: npx prisma studio"
    echo "   2. Test the application"
    echo "   3. If everything works, you can delete the safety backup"
    echo ""
else
    echo "❌ Restore failed with exit code $RESTORE_EXIT_CODE"
    echo ""
    if [ -f "$SAFETY_BACKUP" ]; then
        echo "⚠️  Your safety backup is available at: $SAFETY_BACKUP"
        echo "   You can restore it using:"
        echo "   ./scripts/restore-database.sh $SAFETY_BACKUP"
    fi
    echo ""
    exit 1
fi

echo "✅ All done!"
