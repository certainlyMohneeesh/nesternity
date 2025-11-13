# Data Migration Guide: Client to Organisation Architecture

## Overview

This guide covers the migration from the old Client-based architecture to the new Organisation-centric architecture. The migration includes three main scripts:

1. **migrate-to-organisations.ts** - Main migration script
2. **verify-migration.ts** - Verification and validation
3. **rollback-migration.ts** - Rollback in case of issues

---

## Migration Process

### Phase 1: Pre-Migration Preparation

#### 1.1 Backup Your Database

**Critical: Always backup before migration!**

```bash
# For PostgreSQL
pg_dump -U username -d nesternity > backup_$(date +%Y%m%d_%H%M%S).sql

# For MySQL
mysqldump -u username -p nesternity > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 Verify Current State

Check your current database state:

```bash
# Count clients
npx prisma studio
# Navigate to Client model and check count
```

#### 1.3 Review the Schema

Ensure you have the latest Prisma schema:

```bash
npx prisma generate
npx prisma db push  # Already done
```

---

### Phase 2: Dry Run Migration

**Always run dry-run first!**

#### 2.1 Basic Dry Run

```bash
npx tsx scripts/migrate-to-organisations.ts
```

This will:
- Show what changes would be made
- NOT commit any changes to the database
- Display a summary of planned operations

#### 2.2 Verbose Dry Run

For detailed information:

```bash
npx tsx scripts/migrate-to-organisations.ts --verbose
```

This shows:
- Each user being processed
- Each organisation being created
- Each client being converted
- Each project being updated
- Any errors or warnings encountered

#### 2.3 Review Dry Run Output

Look for:
- ✅ Expected number of organisations to be created
- ⚠️  Any warnings or potential issues
- ❌ Any errors that need fixing before migration

**Example Output:**
```
🚀 Starting Data Migration to Organisations
Mode: DRY RUN (no changes will be saved)
================================================================================

📊 Step 1: Verifying database state...
   Users: 10
   Clients: 25
   Projects: 50
   Existing Organisations: 0

🏢 Step 2: Creating default organisations for users...
   Found 10 users to process
   Creating: "John's Organisation" for john@example.com
   Creating: "My Organisation" for user@example.com
   ...
   ✅ Created 10 default organisations

🔄 Step 3: Converting Client records to Organisations...
   Found 25 clients to convert
   Converting client: Acme Corp (3 projects)
   Converting client: TechStart Inc (2 projects)
   ...
   ✅ Converted 25 clients to organisations

📋 Step 4: Updating project organisation references...
   Found 50 projects to update
   Updating project: Website Redesign → Acme Corp
   Updating project: Mobile App → TechStart Inc
   ...
   ✅ Updated 50 projects

✅ Step 5: Verifying data integrity...
   Owner Organisations: 10
   Client Organisations: 25
   Total Organisations: 35
   ✅ No data integrity issues found

================================================================================
📊 MIGRATION SUMMARY
================================================================================
Mode: DRY RUN
Users Processed: 10
Default Organisations Created: 10
Clients Converted: 25
Projects Updated: 50
Errors: 0
================================================================================

⚠️  This was a DRY RUN. No changes were committed to the database.
Run with --commit flag to apply changes.
```

---

### Phase 3: Execute Migration

Once dry run looks good:

#### 3.1 Run Migration

```bash
npx tsx scripts/migrate-to-organisations.ts --commit
```

**What happens:**
1. Creates "My Organisation" for each user (type=OWNER)
2. Converts all Client records to Organisation (type=CLIENT)
3. Updates Project.organisationId from Project.clientId
4. Verifies data integrity

#### 3.2 With Verbose Output

```bash
npx tsx scripts/migrate-to-organisations.ts --commit --verbose
```

#### 3.3 Monitor Progress

The script will show real-time progress:
- ✅ Successful operations
- ⚠️  Warnings (non-critical)
- ❌ Errors (requires attention)

---

### Phase 4: Verification

After migration completes, verify the results:

#### 4.1 Run Verification Script

```bash
npx tsx scripts/verify-migration.ts
```

This performs 10 comprehensive checks:

1. **User Coverage** - All users have organisations
2. **Organisation Types** - Count of OWNER vs CLIENT orgs
3. **Client Conversion** - All clients converted
4. **Project References** - All projects have organisationId
5. **Status Distribution** - Active/Inactive/Prospect counts
6. **Contact Information** - Email/Phone/Address coverage
7. **Relationship Integrity** - Valid foreign keys
8. **Sample Data Inspection** - Example records
9. **Detailed Project Analysis** - Unmigrated projects
10. **Data Consistency** - Duplicate detection

**Expected Output:**

```
🔍 MIGRATION VERIFICATION REPORT
================================================================================

1️⃣  Checking User Coverage...
   Total Users: 10
   Users with Organisations: 10
   Users with OWNER Organisation: 10
   ✅ All users have OWNER organisation

2️⃣  Checking Organisation Types...
   OWNER Organisations: 10
   CLIENT Organisations: 25
   Total Organisations: 35

3️⃣  Checking Client Conversion...
   Total Clients in database: 25
   CLIENT Organisations created: 25
   ✅ All clients converted to organisations

4️⃣  Checking Project References...
   Total Projects: 50
   Projects with organisationId: 50
   Projects with clientId: 50
   Projects with both: 50
   Orphaned projects: 0
   ✅ All projects have organisationId

5️⃣  Checking Organisation Status Distribution...
   ACTIVE: 30
   INACTIVE: 3
   PROSPECT: 2

6️⃣  Checking Organisation Contact Information...
   Organisations with email: 35/35
   Organisations with phone: 28/35
   Organisations with address: 20/35

7️⃣  Checking Relationship Integrity...
   ✅ All project-organisation relationships are valid

8️⃣  Sample Data Inspection...
   Sample OWNER Organisation:
      Name: John's Organisation
      Users: john@example.com
      Projects: 5

   Sample CLIENT Organisation:
      Name: Acme Corp
      Users: john@example.com
      Projects: 3

9️⃣  Detailed Project Analysis...
   ✅ All projects with clients have been migrated

🔟  Data Consistency Checks...
   ✅ No duplicate organisations detected

================================================================================
📋 VERIFICATION SUMMARY
================================================================================
✅ MIGRATION SUCCESSFUL - No issues or warnings found!
================================================================================
```

#### 4.2 Manual Verification

Open Prisma Studio and verify:

```bash
npx prisma studio
```

Check:
- Organisation table has correct number of records
- Projects are linked to organisations
- User organisations are correct

---

### Phase 5: Rollback (If Needed)

If something goes wrong, you can rollback:

#### 5.1 Dry Run Rollback

```bash
npx tsx scripts/rollback-migration.ts
```

#### 5.2 Execute Rollback (Projects Only)

```bash
npx tsx scripts/rollback-migration.ts --commit
```

This will:
- Set Project.organisationId back to null
- Keep clientId intact
- Preserve all organisations

#### 5.3 Full Rollback (Projects + Organisations)

```bash
npx tsx scripts/rollback-migration.ts --commit --delete-orgs
```

⚠️ **Warning:** This will also delete auto-created organisations!

This will:
- Set Project.organisationId back to null
- Delete organisations with "Auto-created during migration" in notes
- Delete organisations with "Migrated from Client" in notes
- Preserve manually created organisations

#### 5.4 Restore from Backup

If rollback doesn't work, restore from backup:

```bash
# PostgreSQL
psql -U username -d nesternity < backup_20250112_120000.sql

# MySQL
mysql -u username -p nesternity < backup_20250112_120000.sql
```

---

## Migration Script Details

### migrate-to-organisations.ts

**What it does:**

1. **Creates Default Organisations**
   - One "My Organisation" per user
   - Type: OWNER
   - Status: ACTIVE
   - Linked to the user

2. **Converts Clients**
   - Client → Organisation
   - Type: CLIENT
   - Preserves all fields (name, email, phone, address, budget, etc.)
   - Maintains client status mapping

3. **Updates Projects**
   - Sets Project.organisationId from corresponding organisation
   - Keeps Project.clientId intact for rollback safety

4. **Verifies Integrity**
   - Checks all users have OWNER org
   - Checks all projects have organisationId
   - Reports any issues

**Usage:**
```bash
# Dry run (safe, no changes)
npx tsx scripts/migrate-to-organisations.ts

# Dry run with details
npx tsx scripts/migrate-to-organisations.ts --verbose

# Execute migration
npx tsx scripts/migrate-to-organisations.ts --commit

# Execute with details
npx tsx scripts/migrate-to-organisations.ts --commit --verbose

# Help
npx tsx scripts/migrate-to-organisations.ts --help
```

---

### verify-migration.ts

**What it does:**

Runs 10 comprehensive verification checks:

1. User coverage check
2. Organisation type distribution
3. Client to organisation conversion
4. Project organisation references
5. Status distribution
6. Contact information coverage
7. Relationship integrity
8. Sample data inspection
9. Detailed project analysis
10. Data consistency checks

**Returns:**
- Exit code 0 if successful
- Exit code 1 if issues found

**Usage:**
```bash
npx tsx scripts/verify-migration.ts
```

---

### rollback-migration.ts

**What it does:**

1. **Revert Project References**
   - Sets Project.organisationId back to null
   - Keeps Project.clientId intact

2. **Delete Auto-Created Organisations (Optional)**
   - Only deletes orgs with migration notes
   - Skips orgs with attached projects
   - Preserves manually created orgs

**Safety Features:**
- 5-second delay before production rollback
- Won't delete orgs with projects
- Won't delete manually created orgs

**Usage:**
```bash
# Dry run (safe)
npx tsx scripts/rollback-migration.ts

# Dry run with details
npx tsx scripts/rollback-migration.ts --verbose

# Rollback projects only
npx tsx scripts/rollback-migration.ts --commit

# Full rollback (projects + orgs)
npx tsx scripts/rollback-migration.ts --commit --delete-orgs

# Full rollback with details
npx tsx scripts/rollback-migration.ts --commit --delete-orgs --verbose

# Help
npx tsx scripts/rollback-migration.ts --help
```

---

## Troubleshooting

### Issue: "Some users don't have OWNER organisation"

**Cause:** Migration script didn't run completely or was interrupted

**Solution:**
```bash
# Run migration again (it will skip existing orgs)
npx tsx scripts/migrate-to-organisations.ts --commit
```

---

### Issue: "Projects missing organisationId"

**Cause:** Client couldn't be matched to organisation

**Check:**
1. Does the client exist in the database?
2. Was the client converted to organisation?
3. Do names/emails match?

**Solution:**
```bash
# Re-run migration
npx tsx scripts/migrate-to-organisations.ts --commit --verbose

# Check specific projects
npx prisma studio
```

---

### Issue: "Duplicate organisations"

**Cause:** Migration ran multiple times without checking existing orgs

**Solution:**
```bash
# Manually merge duplicates in Prisma Studio
npx prisma studio

# Or rollback and re-run
npx tsx scripts/rollback-migration.ts --commit
npx tsx scripts/migrate-to-organisations.ts --commit
```

---

### Issue: "Migration script errors out"

**Check:**
1. Prisma schema is up to date: `npx prisma generate`
2. Database is accessible
3. You have sufficient disk space
4. No foreign key violations

**Solution:**
```bash
# Check Prisma connection
npx prisma db pull

# Check schema
npx prisma validate

# Re-run with verbose to see exact error
npx tsx scripts/migrate-to-organisations.ts --verbose
```

---

## Post-Migration Checklist

After successful migration:

- [ ] Verification script shows ✅ all checks passed
- [ ] All users visible in Prisma Studio have organisations
- [ ] All projects have organisationId set
- [ ] Test creating new organisation in UI
- [ ] Test creating new project in UI
- [ ] Test breadcrumb navigation
- [ ] Test organisation switching
- [ ] Backup the migrated database
- [ ] Update environment variables if needed
- [ ] Deploy to staging/production

---

## NPM Scripts

Add to package.json for easier access:

```json
{
  "scripts": {
    "migrate:org:dry": "tsx scripts/migrate-to-organisations.ts",
    "migrate:org:verbose": "tsx scripts/migrate-to-organisations.ts --verbose",
    "migrate:org:commit": "tsx scripts/migrate-to-organisations.ts --commit",
    "migrate:org:verify": "tsx scripts/verify-migration.ts",
    "migrate:org:rollback": "tsx scripts/rollback-migration.ts --commit",
    "migrate:org:rollback-full": "tsx scripts/rollback-migration.ts --commit --delete-orgs"
  }
}
```

Then use:
```bash
npm run migrate:org:dry         # Dry run
npm run migrate:org:commit      # Execute migration
npm run migrate:org:verify      # Verify results
npm run migrate:org:rollback    # Rollback if needed
```

---

## Important Notes

1. **Always backup first!** There's no substitute for a good backup.

2. **Run dry-run first** to see what will happen without committing changes.

3. **Check verification** after migration to ensure everything worked correctly.

4. **Keep clientId** for now - we'll remove it in a future migration after confirming everything works.

5. **Monitor production** closely after migration to catch any issues early.

6. **Have rollback ready** - know how to rollback before you need to.

---

## Timeline Estimate

- **Backup Database:** 2-5 minutes
- **Dry Run Migration:** 1-2 minutes
- **Review Dry Run:** 5-10 minutes
- **Execute Migration:** 2-5 minutes (depends on data size)
- **Verification:** 1-2 minutes
- **Testing:** 10-20 minutes
- **Total:** ~25-45 minutes

---

## Support

If you encounter issues:

1. Check the error messages in script output
2. Run verification script to identify problems
3. Review this guide's troubleshooting section
4. Check Prisma Studio for data inspection
5. Use rollback if necessary

---

4. Check Prisma Studio for data inspection
5. Use rollback if necessary

---

## Phase 7: Route Redirects (COMPLETE ✅)

After successful migration, route redirects have been implemented to seamlessly transition users from old routes to the new organisation-centric structure.

### Automatic Redirects

All old routes are automatically redirected by middleware:

| Old Route                      | New Route                              |
|--------------------------------|----------------------------------------|
| `/dashboard/clients`           | `/dashboard/organisation?tab=clients`  |
| `/dashboard/projects`          | `/dashboard/organisation`              |
| `/dashboard/clients/[id]`      | `/dashboard/organisation/[id]`         |

### User Experience

1. **Automatic Redirection**: Old bookmarks and links work automatically
2. **Deprecation Notices**: Warning banners inform users about the change
3. **3-Second Redirect**: Client-side redirect after showing deprecation notice
4. **Updated Navigation**: Main menu now shows "Organisations" instead of separate Clients/Projects

### Implementation Details

- ✅ Middleware handles all redirects before authentication
- ✅ Query parameters preserved during redirects
- ✅ Console logging for debugging redirect flow
- ✅ All internal navigation links updated
- ✅ Deprecation notices on old pages

For complete details, see [PHASE_7_COMPLETE.md](./PHASE_7_COMPLETE.md)

---

## Next Steps

After successful migration and route redirects:

1. ✅ Test the new organisation UI
2. ✅ Route redirects implemented (Phase 7) ✅
3. ✅ Migrate existing features to new routes (Phase 8)
4. ✅ Update documentation
5. ✅ Train users on new structure
6. ✅ Remove old Client model (future migration)

```
