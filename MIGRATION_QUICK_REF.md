# Migration Quick Reference

## 🚀 Quick Start

### 1. Backup Database (CRITICAL!)
```bash
# Using the automated backup script (recommended for Supabase)
./scripts/backup-database.sh

# Or manually with Supabase credentials:
pg_dump -h aws-1-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.scmyzihaokadwwszaimd \
  -d postgres \
  --no-owner --no-acl --clean --if-exists \
  -f backup_$(date +%Y%m%d_%H%M%S).sql
# Password when prompted: l3Z3enEzZq0yGwyj
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run Dry Run (Safe - No Changes)
```bash
npm run migrate:org:dry
# Or with details:
npm run migrate:org:verbose
```

### 4. Execute Migration
```bash
npm run migrate:org:commit
```

### 5. Verify Results
```bash
npm run migrate:org:verify
```

---

## 📋 Available Commands

| Command | Description | Safe? |
|---------|-------------|-------|
| `npm run migrate:org:dry` | Preview changes without committing | ✅ Yes |
| `npm run migrate:org:verbose` | Preview with detailed output | ✅ Yes |
| `npm run migrate:org:commit` | Execute the migration | ⚠️ No (commits changes) |
| `npm run migrate:org:verify` | Verify migration results | ✅ Yes (read-only) |
| `npm run migrate:org:rollback` | Rollback project references | ⚠️ No (reverts changes) |
| `npm run migrate:org:rollback-full` | Full rollback + delete orgs | ❌ Dangerous |

---

## ✅ Success Checklist

After migration, verify:

- [ ] `npm run migrate:org:verify` shows ✅ all checks passed
- [ ] All users have organisations (check Prisma Studio)
- [ ] All projects have organisationId
- [ ] Test creating new organisation in UI (`/dashboard/organisation`)
- [ ] Test creating new project under organisation
- [ ] Test breadcrumb navigation
- [ ] Test switching between organisations
- [ ] Create new database backup

---

## 🆘 Troubleshooting

### Migration fails with "Some users don't have organisations"
```bash
# Re-run migration (it will skip existing ones)
npm run migrate:org:commit
```

### Need to rollback
```bash
# Revert project references only
npm run migrate:org:rollback

# Full rollback (also deletes auto-created orgs)
npm run migrate:org:rollback-full
```

### Restore from backup
```bash
# Using the automated restore script (recommended)
./scripts/restore-database.sh backups/backup_20251112_231639.sql

# Or manually with Supabase credentials:
psql -h aws-1-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.scmyzihaokadwwszaimd \
  -d postgres \
  -f backups/backup_20251112_231639.sql
# Password when prompted: l3Z3enEzZq0yGwyj
```

### List available backups
```bash
ls -lh backups/
```

---

## 🎯 What Gets Created

### For Each User:
- 1x OWNER organisation (e.g., "John's Organisation")
- Type: OWNER
- Status: ACTIVE
- Linked to user

### For Each Client:
- 1x CLIENT organisation
- All client data preserved (name, email, phone, address, budget, etc.)
- Status mapped: ACTIVE → ACTIVE, INACTIVE → INACTIVE
- Linked to original user

### For Each Project:
- `organisationId` field populated
- Linked to corresponding organisation
- `clientId` kept for rollback safety

---

## ⏱️ Time Estimate

- Backup: 2-5 min
- Dry run + review: 5-10 min
- Execute: 2-5 min
- Verify: 1-2 min
- Testing: 10-20 min
- **Total: ~25-45 min**

---

## 📊 Expected Results (Example)

For a system with:
- 10 users
- 25 clients  
- 50 projects

After migration:
- **35 organisations** (10 OWNER + 25 CLIENT)
- **50 projects** with organisationId
- **10 users** with OWNER organisations
- **0 errors**

---

## 🔒 Safety Features

✅ **Dry run mode** - Preview without committing
✅ **Verbose logging** - See exactly what happens
✅ **Data integrity checks** - Automatic verification
✅ **Rollback capability** - Revert if needed
✅ **Preserves clientId** - Backward compatibility
✅ **Skip existing** - Won't create duplicates
✅ **Error handling** - Continues on non-critical errors

---

## 📝 Next Steps After Migration

1. ✅ Test new UI at `/dashboard/organisation`
2. ✅ Add route redirects (Phase 7)
3. ✅ Migrate features to new structure (Phase 8)
4. ✅ Update documentation
5. ✅ Deploy to production

---

## 📞 Need Help?

1. Check the full guide: `MIGRATION_GUIDE.md`
2. Emergency recovery: `EMERGENCY_RECOVERY.md`
3. Run verification: `npm run migrate:org:verify`
4. Check Prisma Studio: `npx prisma studio`
5. Review error messages in console output

---

## 🆘 Emergency Recovery

**If migration fails or causes issues:**

```bash
# Quick restore (recommended)
./scripts/restore-database.sh backups/backup_20251112_230509.sql

# List available backups
ls -lh backups/

# Verify after restore
npx prisma studio
```

**See `EMERGENCY_RECOVERY.md` for detailed recovery procedures.**

---

**Remember:** Always backup before migration!
