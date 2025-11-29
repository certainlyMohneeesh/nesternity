# Auth Route Testing Guide

## Quick Start Testing

This guide helps you verify that the auth route updates work correctly with the new organisation-centric architecture.

---

## Pre-Test Checklist

- [ ] Database is running and accessible
- [ ] Supabase is configured correctly
- [ ] Environment variables are set (`.env` file)
- [ ] Build passes: `pnpm run build`
- [ ] Development server can start: `pnpm run dev`

---

## Test 1: Email Registration (Primary Test)

### Steps

1. **Clear test data** (optional):
   ```bash
   psql -d nesternity -c "DELETE FROM \"User\" WHERE email = 'test@example.com';"
   psql -d nesternity -c "DELETE FROM \"Organisation\" WHERE email = 'test@example.com';"
   ```

2. **Start dev server**:
   ```bash
   cd /home/chemicalmyth/Desktop/Nesternity/nesternity
   pnpm run dev
   ```

3. **Navigate to registration page**:
   - Open browser: `http://localhost:3000/register`

4. **Fill registration form**:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123!`

5. **Submit form**

6. **Check email** (if email confirmation enabled):
   - Click confirmation link
   - Or check admin panel for confirmation status

7. **Login with new credentials**:
   - Navigate to: `http://localhost:3000/login`
   - Enter email and password
   - Submit

### Expected Results

✅ **During Registration:**
- User created in Supabase
- User synced to Prisma database
- Organisation created automatically
- Team and board created
- Success message shown

✅ **In Database:**
```sql
-- Check user
SELECT * FROM "User" WHERE email = 'test@example.com';

-- Check organisation
SELECT * FROM "Organisation" WHERE email = 'test@example.com';

-- Expected organisation properties:
-- name: "Test User's Organisation"
-- type: "OWNER"
-- status: "ACTIVE"
-- ownerId: matches user.id
```

✅ **In Dashboard:**
- Can access `/dashboard/organisation`
- Organisation appears in list
- Organisation name shows "Test User's Organisation"
- Can click and view organisation details

✅ **In Logs:**
```
🏢 Creating default OWNER organisation
✅ Created OWNER organisation: [organisation-id]
```

### Troubleshooting

❌ **Organisation Not Created:**
- Check server logs for errors
- Verify Prisma schema is migrated
- Check if sync-user route executed
- Manual fix: See "Manual Organisation Creation" section

❌ **Redirect Loops:**
- Check middleware configuration
- Verify organisation exists in database
- Check user authentication status

---

## Test 2: OAuth Registration (Google)

### Steps

1. **Configure Google OAuth** (if not already):
   - Check Supabase dashboard for OAuth settings
   - Verify redirect URLs are set

2. **Navigate to login page**:
   - Open browser: `http://localhost:3000/login`

3. **Click "Continue with Google"**

4. **Complete OAuth flow**:
   - Select Google account
   - Grant permissions
   - Redirected back to app

5. **Check dashboard**:
   - Should land on `/dashboard/organisation`
   - Organisation should be visible

### Expected Results

✅ **OAuth Flow:**
- Google authentication successful
- Redirected to dashboard
- No errors shown

✅ **In Database:**
```sql
-- Check user (replace email with your Google email)
SELECT * FROM "User" WHERE email = 'your.google.email@gmail.com';

-- Check organisation
SELECT * FROM "Organisation" WHERE "ownerId" = (
  SELECT id FROM "User" WHERE email = 'your.google.email@gmail.com'
);

-- Expected: Organisation with name like "Your Name's Organisation"
```

✅ **In Dashboard:**
- Organisation visible immediately
- Can access all features
- No setup required

### Troubleshooting

❌ **OAuth Fails:**
- Check Supabase OAuth configuration
- Verify redirect URLs match
- Check environment variables

❌ **Organisation Not Created:**
- Check sync-user route logs
- Verify OAuth callback succeeded
- Manual fix if needed

---

## Test 3: Route Redirects

### Steps

1. **Login with test user** (from Test 1 or 2)

2. **Test Redirect 1 - Clients**:
   - Navigate to: `http://localhost:3000/dashboard/clients`
   - **Expected:** Redirect to `/dashboard/organisation?tab=clients`
   - **Expected:** Yellow deprecation notice for 3 seconds
   - **Expected:** Auto-redirect to organisation page

3. **Test Redirect 2 - Projects**:
   - Navigate to: `http://localhost:3000/dashboard/projects`
   - **Expected:** Redirect to `/dashboard/organisation`
   - **Expected:** Yellow deprecation notice
   - **Expected:** Auto-redirect

4. **Test Redirect 3 - Specific Client**:
   - Get organisation ID from database:
     ```sql
     SELECT id FROM "Organisation" LIMIT 1;
     ```
   - Navigate to: `http://localhost:3000/dashboard/clients/[org-id]`
   - **Expected:** Redirect to `/dashboard/organisation/[org-id]`

### Expected Results

✅ **All Redirects Work:**
- No 404 errors
- Clean URL transitions
- Deprecation notices display
- Auto-redirect after 3 seconds

✅ **Organisation Page Loads:**
- Organisation details visible
- Tabs work correctly
- No infinite redirect loops

### Troubleshooting

❌ **Redirect Loops:**
- Check middleware.ts configuration
- Verify authentication is working
- Check organisation exists

❌ **404 Errors:**
- Verify routes exist
- Check Next.js build
- Restart dev server

---

## Test 4: Fallback Paths

### Testing Sync-User Fallback

This tests what happens if the sync-user API fails.

**Method 1: Temporary Route Disable**

1. **Temporarily rename sync-user route**:
   ```bash
   mv src/app/api/auth/sync-user/route.ts src/app/api/auth/sync-user/route.ts.disabled
   ```

2. **Register new user**:
   - Use Test 1 steps with different email
   - Registration should still work

3. **Check organisation created**:
   ```sql
   SELECT * FROM "Organisation" WHERE email = 'fallback-test@example.com';
   ```

4. **Restore route**:
   ```bash
   mv src/app/api/auth/sync-user/route.ts.disabled src/app/api/auth/sync-user/route.ts
   ```

**Expected:** Organisation created via fallback path in register route

---

## Manual Tests

### Database Verification

```sql
-- Count organisations created today
SELECT COUNT(*) 
FROM "Organisation" 
WHERE "createdAt" >= CURRENT_DATE;

-- List all OWNER organisations
SELECT 
  o.id,
  o.name,
  o.email,
  o.type,
  o.status,
  u.name as owner_name,
  u.email as owner_email
FROM "Organisation" o
JOIN "User" u ON u.id = o."ownerId"
WHERE o.type = 'OWNER'
ORDER BY o."createdAt" DESC;

-- Check for users without organisations (should be empty)
SELECT 
  u.id,
  u.email,
  u.name,
  u."createdAt"
FROM "User" u
LEFT JOIN "Organisation" o ON o."ownerId" = u.id
WHERE o.id IS NULL
  AND u."createdAt" >= CURRENT_DATE - INTERVAL '7 days';
```

### Log Verification

```bash
# Check for organisation creation logs
grep "Creating default OWNER organisation" .next/server/app/api/auth/*/route.js

# Check for organisation creation success
grep "Created OWNER organisation" .next/server/app/api/auth/*/route.js

# Check for errors
grep -i "error" .next/server/app/api/auth/*/route.js | grep -i organisation
```

---

## Performance Testing

### Load Test (Optional)

Test multiple concurrent registrations:

```bash
# Install artillery (if not installed)
npm install -g artillery

# Create artillery config
cat > artillery-auth-test.yml << 'EOF'
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
  processor: "./artillery-functions.js"

scenarios:
  - name: "User Registration"
    flow:
      - post:
          url: "/api/auth/register"
          json:
            name: "Test User {{ $randomNumber() }}"
            email: "test{{ $randomNumber() }}@example.com"
            password: "TestPassword123!"
EOF

# Run load test
artillery run artillery-auth-test.yml
```

**Expected Results:**
- All registrations succeed
- Organisations created for each user
- No errors in logs
- Database consistent

---

## Cleanup

### Remove Test Data

```sql
-- Remove test users
DELETE FROM "User" 
WHERE email LIKE 'test%@example.com';

-- Remove test organisations
DELETE FROM "Organisation" 
WHERE email LIKE 'test%@example.com';

-- Verify cleanup
SELECT COUNT(*) FROM "User" WHERE email LIKE 'test%';
SELECT COUNT(*) FROM "Organisation" WHERE email LIKE 'test%';
```

---

## Manual Organisation Creation (If Needed)

If a user exists without an organisation:

### Via Database

```sql
-- Create organisation for specific user
INSERT INTO "Organisation" (
  id,
  name,
  email,
  type,
  status,
  "ownerId",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  u.name || '''s Organisation',
  u.email,
  'OWNER',
  'ACTIVE',
  u.id,
  NOW(),
  NOW()
FROM "User" u
WHERE u.email = 'specific-user@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM "Organisation" o WHERE o."ownerId" = u.id
  );
```

### Via Script

Create `scripts/create-missing-organisations.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function createMissingOrganisations() {
  // Find users without organisations
  const usersWithoutOrgs = await db.user.findMany({
    where: {
      ownedOrganisation: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log(`Found ${usersWithoutOrgs.length} users without organisations`);

  // Create organisations
  for (const user of usersWithoutOrgs) {
    const org = await db.organisation.create({
      data: {
        name: `${user.name}'s Organisation`,
        email: user.email,
        type: 'OWNER',
        status: 'ACTIVE',
        ownerId: user.id,
      },
    });
    console.log(`✅ Created organisation for ${user.email}: ${org.id}`);
  }

  console.log('✅ All done!');
}

createMissingOrganisations()
  .catch(console.error)
  .finally(() => db.$disconnect());
```

Run with:
```bash
node scripts/create-missing-organisations.js
```

---

## Success Checklist

- [ ] Test 1: Email registration creates organisation ✅
- [ ] Test 2: OAuth registration creates organisation ✅
- [ ] Test 3: All route redirects work ✅
- [ ] Test 4: Fallback paths create organisations ✅
- [ ] Database queries show correct data ✅
- [ ] No errors in server logs ✅
- [ ] Dashboard loads organisation page ✅
- [ ] Users can access all features ✅

---

## Next Steps After Testing

1. **If Tests Pass:**
   - Deploy to staging environment
   - Test in staging
   - Monitor for issues
   - Deploy to production

2. **If Tests Fail:**
   - Review error logs
   - Check database state
   - Review auth route code
   - Fix issues and re-test

3. **After Production Deploy:**
   - Monitor organisation creation rate
   - Check for users without organisations
   - Review error logs daily
   - Gather user feedback

---

## Contact

For issues during testing:
- Check `AUTH_ROUTE_UPDATE.md` for troubleshooting
- Review server logs
- Check database state
- Verify environment variables

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Ready for Testing
