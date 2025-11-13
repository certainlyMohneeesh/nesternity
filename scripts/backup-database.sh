#!/bin/bash

# Database Backup Script for Supabase
# This script creates a backup of your Supabase PostgreSQL database

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Generate timestamp for backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"
BACKUP_DIR="backups"

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "Timestamp: $TIMESTAMP"
echo "Backup file: $BACKUP_DIR/$BACKUP_FILE"
echo ""

# Extract connection details from DIRECT_URL
# Format: postgresql://user:password@host:port/database
if [ -z "$DIRECT_URL" ]; then
    echo "❌ Error: DIRECT_URL not found in .env file"
    exit 1
fi

# Parse the connection string
# postgresql://postgres.scmyzihaokadwwszaimd:l3Z3enEzZq0yGwyj@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
DB_USER="postgres.scmyzihaokadwwszaimd"
DB_PASSWORD="l3Z3enEzZq0yGwyj"
DB_HOST="aws-1-ap-south-1.pooler.supabase.com"
DB_PORT="5432"
DB_NAME="postgres"

echo "📊 Database Details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Set password in environment for pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Run pg_dump
echo "🚀 Running backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    -f "$BACKUP_DIR/$BACKUP_FILE" 2>&1

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo ""
    echo "✅ Backup completed successfully!"
    echo "📁 File: $BACKUP_DIR/$BACKUP_FILE"
    echo "📊 Size: $BACKUP_SIZE"
    echo ""
    echo "To restore this backup:"
    echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_DIR/$BACKUP_FILE"
else
    echo ""
    echo "❌ Backup failed!"
    echo "Please check the error messages above."
    exit 1
fi

# Unset password
unset PGPASSWORD

# Optional: Keep only last 5 backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql 2>/dev/null | wc -l)
if [ $BACKUP_COUNT -gt 5 ]; then
    echo "🧹 Cleaning up old backups (keeping last 5)..."
    ls -t "$BACKUP_DIR"/backup_*.sql | tail -n +6 | xargs rm -f
    echo "✅ Cleanup complete"
fi

echo ""
echo "✅ All done!"
