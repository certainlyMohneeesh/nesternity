# Emergency Database Recovery Guide

## 🆘 When Things Go Wrong

If the migration fails or causes issues, follow these steps to restore your database.

---

## Quick Recovery

### Step 1: Stop the Application
```bash
# Press Ctrl+C in your dev server terminal
# Or kill the process
pkill -f "next dev"
```

### Step 2: Restore the Backup

**Using the automated script (RECOMMENDED):**
```bash
./scripts/restore-database.sh backups/backup_20251112_230509.sql
```

**Or manually:**
```bash
psql -h aws-1-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.scmyzihaokadwwszaimd \
  -d postgres \
  -f backups/backup_20251112_230509.sql
# Password: l3Z3enEzZq0yGwyj
```

### Step 3: Verify Restoration
```bash
npx prisma studio
```

Check that your data is back to the state before migration.

---

## Common Scenarios

### Scenario 1: Migration Failed Midway

**Symptoms:**
- Migration script shows errors
- Some data migrated, some didn't
- Database is in inconsistent state

**Solution:**
```bash
# 1. Restore from backup
./scripts/restore-database.sh backups/backup_20251112_230509.sql

# 2. Review error messages
# 3. Fix the issue (if known)
# 4. Try migration again
npm run migrate:org:commit
```

---

### Scenario 2: Migration Succeeded but UI Broken

**Symptoms:**
- Migration completed without errors
- New UI routes don't work
- Application shows errors

**Solution:**
```bash
# 1. Check if Prisma client is regenerated
npx prisma generate

# 2. Restart dev server
npm run dev

# 3. Clear browser cache and try again

# 4. If still broken, restore backup
./scripts/restore-database.sh backups/backup_20251112_230509.sql
```

---

### Scenario 3: Data Loss or Corruption

**Symptoms:**
- Missing users, clients, or projects
- Data appears incorrect
- Relationships broken

**Solution:**
```bash
# Restore immediately
./scripts/restore-database.sh backups/backup_20251112_230509.sql

# Then investigate what went wrong before trying again
```

---

### Scenario 4: Wrong Backup Restored

**Symptoms:**
- Restored an old backup by mistake
- Data is from wrong time period

**Solution:**
```bash
# The restore script creates a safety backup before restoring
# Check for pre-restore backups:
ls -lh backups/pre-restore-*

# Restore the most recent pre-restore backup:
./scripts/restore-database.sh backups/pre-restore-backup_YYYYMMDD_HHMMSS.sql
```

---

## Available Backups

### List all backups:
```bash
ls -lh backups/
```

### View backup details:
```bash
# Show file size and date
ls -lh backups/backup_20251112_230509.sql

# Count tables in backup
grep -c "CREATE TABLE" backups/backup_20251112_230509.sql
```

---

## Restore Script Features

The automated restore script (`./scripts/restore-database.sh`) includes:

✅ **Safety backup** - Creates a backup before restoring
✅ **Confirmation prompt** - Requires explicit "yes" to proceed  
✅ **File validation** - Checks if backup file exists
✅ **Clear warnings** - Shows exactly what will happen
✅ **Error handling** - Reports issues clearly
✅ **Rollback info** - Tells you how to undo if needed

---

## Manual Restore Steps

If the automated script doesn't work:

### 1. Set password in environment
```bash
export PGPASSWORD="l3Z3enEzZq0yGwyj"
```

### 2. Restore the backup
```bash
psql -h aws-1-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.scmyzihaokadwwszaimd \
  -d postgres \
  -f backups/backup_20251112_230509.sql
```

### 3. Unset password
```bash
unset PGPASSWORD
```

### 4. Verify
```bash
npx prisma studio
```

---

## Rollback vs Restore

### Use Rollback When:
- Migration completed successfully
- Want to undo ONLY the organisation changes
- Keep all other data changes that happened after migration

```bash
# Revert project references only
npm run migrate:org:rollback

# Revert + delete auto-created organisations
npm run migrate:org:rollback-full
```

### Use Restore When:
- Migration failed with errors
- Data corruption occurred
- Want to go back to exact state before migration
- Something went seriously wrong

```bash
./scripts/restore-database.sh backups/backup_20251112_230509.sql
```

---

## Prevention Tips

### Before Migration:
1. ✅ Always create a backup
2. ✅ Test on development/staging first
3. ✅ Read migration output carefully
4. ✅ Have the restore command ready

### During Migration:
1. ✅ Don't interrupt the migration process
2. ✅ Watch for error messages
3. ✅ Note any warnings
4. ✅ Keep terminal output

### After Migration:
1. ✅ Run verification immediately
2. ✅ Test the UI thoroughly
3. ✅ Create a new backup of migrated state
4. ✅ Keep old backup for at least 7 days

---

## Troubleshooting

### "Connection refused" error
```bash
# Check if you're connected to the internet
ping 8.8.8.8

# Verify database URL is correct
echo $DIRECT_URL
```

### "Permission denied" error
```bash
# Make sure scripts are executable
chmod +x scripts/*.sh
```

### "File not found" error
```bash
# Check if backup exists
ls -lh backups/

# Use absolute path
./scripts/restore-database.sh /full/path/to/backup.sql
```

### Restore is slow
This is normal! Restoring can take 2-10 minutes depending on:
- Database size
- Network speed
- Number of tables/indexes

**Be patient and don't interrupt the process.**

---

## Getting Help

If you're stuck:

1. **Check the error message** - Read it carefully
2. **List available backups** - `ls -lh backups/`
3. **Try the restore script** - It has built-in safety features
4. **Check Prisma Studio** - See current database state
5. **Review migration logs** - Look for specific errors

---

## Emergency Contacts

### Your Backups:
```
backups/backup_20251112_230509.sql  (Pre-migration backup)
backups/pre-restore-backup_*.sql    (Safety backups)
```

### Key Commands:
```bash
# Restore
./scripts/restore-database.sh backups/backup_20251112_230509.sql

# Rollback (if migration completed)
npm run migrate:org:rollback

# Verify database
npx prisma studio
```

---

## Success Checklist After Restore

After restoring, verify:

- [ ] Can access Prisma Studio
- [ ] See expected number of users
- [ ] See expected number of clients  
- [ ] See expected number of projects
- [ ] Application starts without errors
- [ ] Can log in to the application
- [ ] No console errors in browser
- [ ] All data looks correct

---

**Remember:** 
- Restoring is SAFE - it won't make things worse
- The restore script creates a safety backup first
- You can always restore the safety backup if needed
- Better to restore quickly than struggle with broken data

---

*Last Updated: November 12, 2025*
*Emergency recovery procedures tested and verified*
