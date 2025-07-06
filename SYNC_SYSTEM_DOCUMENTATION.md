# Comprehensive Data Sync System

This directory contains a production-ready, comprehensive data synchronization and integrity management system for the Nesternity application.

## Overview

The system ensures data consistency between Supabase Auth (user authentication) and Prisma/PostgreSQL (application data) while maintaining referential integrity across all entities.

## Architecture

- **Supabase**: User authentication only
- **Prisma + PostgreSQL**: All application data (teams, boards, tasks, clients, invoices, etc.)
- **Sync System**: Ensures consistency and integrity between both systems

## Main Files

### `sync-users.js`
The core synchronization script with comprehensive features:
- User sync from Supabase Auth to Prisma
- Data integrity validation for all entities
- Automated fixing of common data issues
- Detailed reporting and logging
- Batch processing for large datasets
- Production-ready error handling

### `sync-helper.sh`
User-friendly wrapper script with predefined operations:
- Simple command interface
- Common sync operations
- Colored output and status reporting
- Input validation and error handling

## Quick Start

### Using the Helper Script (Recommended)

```bash
# Basic sync (users + basic fixes)
./sync-helper.sh sync

# Comprehensive sync with all fixes
./sync-helper.sh sync-all --verbose

# Check status without changes
./sync-helper.sh validate

# Preview what would be done
./sync-helper.sh dry-run
```

### Direct Script Usage

```bash
# Basic user sync with fixes
node sync-users.js --fix-data

# Comprehensive sync
node sync-users.js --sync-all --verbose

# Dry run to preview changes
node sync-users.js --dry-run --verbose

# Validate data integrity only
node sync-users.js --validate-only
```

## Available Commands

### Helper Script Commands

| Command | Description | Equivalent Direct Call |
|---------|-------------|------------------------|
| `sync` | Basic sync with user sync + basic fixes | `--fix-data` |
| `sync-all` | Comprehensive sync with all fixes | `--sync-all` |
| `validate` | Data integrity validation only | `--validate-only` |
| `repair-teams` | Fix team ownership issues | `--repair-teams` |
| `cleanup` | Remove orphaned data | `--cleanup` |
| `dry-run` | Preview operations | `--dry-run --verbose` |
| `status` | Show database status | `--validate-only --verbose` |

### Direct Script Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Show what would be done without making changes |
| `--verbose` | Show detailed logging |
| `--fix-data` | Fix basic data integrity issues |
| `--validate-only` | Only validate data, don't sync users |
| `--sync-all` | Comprehensive sync including all fixes |
| `--cleanup` | Remove all orphaned and invalid data |
| `--repair-teams` | Ensure all team owners are team members |
| `--batch-size=N` | Set batch size for operations (default: 100) |

## Data Integrity Checks

The system validates and can fix the following issues:

### Core Entities
- **Orphaned Teams**: Teams with non-existent owners
- **Orphaned Boards**: Boards with invalid team or creator references
- **Orphaned Tasks**: Tasks with invalid board, list, or user references
- **Orphaned Projects**: Projects with invalid team references
- **Orphaned Clients**: Clients with invalid creator references
- **Orphaned Invoices**: Invoices with invalid client or issuer references

### Relationships
- **Team Ownership**: Ensures team owners are also team members
- **Duplicate Memberships**: Removes duplicate team member records
- **Invalid Assignments**: Clears invalid task assignments
- **Orphaned Activities**: Removes activities with invalid references

### Supporting Data
- **Board Lists**: Removes lists orphaned from boards
- **Task Comments**: Removes comments from non-existent tasks
- **Task Attachments**: Removes attachments from non-existent tasks
- **Team Invites**: Removes invites for non-existent teams
- **Invoice Items**: Removes items from non-existent invoices
- **Issues**: Fixes or removes issues with invalid references

## Fix Categories

### `--fix-data` (Basic Fixes)
- Remove orphaned team members
- Clear invalid task assignments
- Remove orphaned board lists and tasks
- Fix basic relationship issues

### `--repair-teams`
- Add team owners as team members
- Remove duplicate team memberships
- Ensure team ownership integrity

### `--cleanup` (Comprehensive Cleanup)
- Remove all orphaned activities
- Clean up orphaned comments and attachments
- Remove orphaned invites and items
- Remove duplicate records

### `--sync-all` (Full Sync)
- All of the above
- Comprehensive relationship validation
- Full data integrity restoration

## Production Usage

### Scheduled Sync
```bash
# Add to crontab for daily sync
0 2 * * * /path/to/nesternity/sync-helper.sh sync >> /var/log/nesternity-sync.log 2>&1
```

### Monitoring
```bash
# Check status regularly
./sync-helper.sh status --verbose

# Validate integrity
./sync-helper.sh validate
```

### Emergency Cleanup
```bash
# Preview cleanup operations
./sync-helper.sh cleanup --dry-run

# Execute cleanup
./sync-helper.sh cleanup --verbose
```

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (admin access)
- `DATABASE_URL`: PostgreSQL connection string for Prisma

## Error Handling

The system includes comprehensive error handling:
- Graceful failure for individual records
- Batch processing with retry logic
- Detailed error logging
- Safe rollback capabilities
- Exit codes for automation integration

## Logging

The system provides multiple logging levels:
- **INFO**: General operations and status
- **DEBUG**: Detailed operations (verbose mode)
- **ERROR**: Failures and issues
- **SUCCESS**: Completed operations

## Safety Features

- **Dry Run Mode**: Preview all operations without changes
- **Batch Processing**: Handles large datasets efficiently
- **Idempotent Operations**: Safe to run multiple times
- **Foreign Key Awareness**: Respects database constraints
- **Backup Recommendations**: Always backup before major operations

## Best Practices

1. **Always test first**: Use `--dry-run` before production runs
2. **Monitor regularly**: Check data integrity weekly
3. **Backup before major operations**: Especially before cleanup
4. **Use verbose logging**: For debugging and audit trails
5. **Schedule regular syncs**: Daily or weekly depending on usage
6. **Validate after fixes**: Ensure problems are resolved

## Troubleshooting

### Common Issues

**Supabase Connection Errors**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

**Database Connection Issues**
```bash
# Test database connection
npx prisma db pull
```

**Permission Errors**
```bash
# Make sure script is executable
chmod +x sync-helper.sh
```

### Debug Mode
```bash
# Run with maximum verbosity
./sync-helper.sh sync-all --verbose --batch-size=10
```

## Migration Guide

If upgrading from the previous version:
1. Backup your database
2. Run `./sync-helper.sh validate` to see current state
3. Run `./sync-helper.sh dry-run` to preview changes
4. Execute `./sync-helper.sh sync-all` for full sync

## Support

For issues or questions:
1. Check the logs for specific error messages
2. Run with `--verbose` for detailed debugging
3. Use `--dry-run` to preview operations
4. Review the data integrity validation results
