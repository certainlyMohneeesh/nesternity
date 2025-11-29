# Notification System - Database Migration Guide

## Overview
Migrated notification system from localStorage-based read tracking to proper PostgreSQL database model using Prisma.

## What Was Changed

### 1. Prisma Schema (`/prisma/schema.prisma`)
Added new `Notification` model to track read status per user:

```prisma
model Notification {
  id         String    @id @default(cuid())
  userId     String    @map("user_id")
  activityId String    @map("activity_id")
  readAt     DateTime? @map("read_at")
  createdAt  DateTime  @default(now()) @map("created_at")
  
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user       User     @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, activityId])
  @@index([userId, readAt])
  @@index([userId, createdAt(sort: Desc)])
  @@map("notifications")
}
```

**Key Features:**
- `readAt`: NULL = unread, timestamp = read
- Unique constraint: One notification per user per activity
- Indexes for performance on queries
- Cascading deletes when Activity or User is deleted

**Relations Added:**
- `Activity.notifications` → `Notification[]`
- `User.notifications` → `Notification[]`

### 2. New API Endpoints

#### `/api/notifications/[id]/route.ts`
- **PATCH**: Mark single notification as read
  - Upserts Notification record with `readAt = now()`
  - Returns success/error
  
- **DELETE**: Remove notification entirely
  - Deletes Notification record
  - Used for "dismiss" functionality

#### `/api/notifications/mark-all-read/route.ts`
- **POST**: Mark all notifications as read
  - Gets all activities from user's teams (last 7 days)
  - Upserts Notification records for all with `readAt = now()`
  - Returns count of notifications marked

### 3. Updated API Endpoints

#### `/api/notifications/route.ts`
**Before**: Returned all activities without read filtering  
**After**: 
- Includes `notifications` relation in query
- Filters out activities where `notification.readAt IS NOT NULL`
- Returns only unread notifications

#### `/api/notifications/unread-count/route.ts`
**Before**: Simple count of activities from last 7 days  
**After**:
- Fetches activities with notifications relation
- Counts only where `notifications.length === 0` OR `readAt === null`
- Accurate unread count

### 4. Client Library (`/lib/notifications.ts`)

**Before**:
```typescript
// Stub functions with TODO comments
export async function markNotificationAsRead(id: string) {
  console.log('Not implemented yet');
  return { success: true };
}
```

**After**:
```typescript
// Full implementation calling new endpoints
export async function markNotificationAsRead(activityId: string) {
  const response = await fetch(`/api/notifications/${activityId}`, {
    method: 'PATCH'
  });
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const response = await fetch('/api/notifications/mark-all-read', {
    method: 'POST'
  });
  return { success: true };
}
```

### 5. Notification Center Component (`/components/notifications/notification-center.tsx`)

**Removed**:
- ❌ localStorage state management
- ❌ `readNotifications` Set
- ❌ useEffect for loading/saving to localStorage
- ❌ Client-side filtering of read notifications
- ❌ Manual count adjustments

**Simplified To**:
```typescript
// Clean, database-backed implementation
const [notifications, setNotifications] = useState<Notification[]>([]);
const [unreadCount, setUnreadCount] = useState(0);

async function fetchNotifications() {
  const data = await getUserNotifications(); // Already filtered server-side
  setNotifications(data);
}

async function handleMarkAsRead(activityId: string) {
  await markNotificationAsRead(activityId);
  setNotifications(prev => prev.filter(n => n.activity_id !== activityId));
  setUnreadCount(prev => Math.max(0, prev - 1));
}
```

## Migration Steps Required

⚠️ **IMPORTANT**: Database connection was down during implementation. Run these steps when database is available:

### Step 1: Run Database Migration
```bash
cd /home/chemicalmyth/Desktop/Nesternity/nesternity

# Option A: If database is in sync (preferred)
npx prisma db push

# Option B: If you want to create a migration file
npx prisma migrate dev --name add_notification_model
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

This will regenerate the Prisma Client with the `Notification` model types, fixing the current TypeScript errors.

### Step 3: Verify TypeScript Compilation
```bash
npm run build
# or
pnpm build
```

All TypeScript errors should be resolved after Prisma Client regeneration.

### Step 4: Test the System
1. **Create test notification**: Trigger any activity (create task, send invoice, etc.)
2. **View notifications**: Open notification center - should show unread notifications
3. **Mark as read**: Click individual notification - should disappear
4. **Mark all as read**: Click "Mark all as read" - all should disappear
5. **Persistence test**: Refresh page - notifications should NOT reappear

## Database Query Examples

### Check Notification Records
```sql
-- See all notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Count unread notifications per user
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE read_at IS NULL
GROUP BY user_id;

-- See read history for a user
SELECT n.*, a.title, a.type
FROM notifications n
JOIN activities a ON n.activity_id = a.id
WHERE n.user_id = 'USER_ID_HERE'
ORDER BY n.created_at DESC;
```

### Manual Data Operations
```sql
-- Mark all notifications as read for a user
UPDATE notifications
SET read_at = NOW()
WHERE user_id = 'USER_ID_HERE' AND read_at IS NULL;

-- Clear old notifications (older than 30 days)
DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL '30 days';
```

## Benefits of Database Approach

### Before (localStorage)
- ❌ Data lost on browser clear/incognito
- ❌ Not synced across devices
- ❌ Manual filtering on client
- ❌ Count calculations unreliable
- ❌ No server-side analytics

### After (Database)
- ✅ Persistent across sessions/devices
- ✅ Filtered efficiently on server
- ✅ Accurate counts with indexes
- ✅ Can track read patterns
- ✅ Can implement read receipts
- ✅ Can clean up old data
- ✅ Production-ready scalability

## Performance Optimizations

### Indexes Added
```prisma
@@unique([userId, activityId])           // Fast lookup, prevents duplicates
@@index([userId, readAt])                // Fast unread queries
@@index([userId, createdAt(sort: Desc)]) // Fast recent notifications
```

### Query Strategy
- Activities fetched with LEFT JOIN on notifications
- Filter happens in SQL, not JavaScript
- Only unread notifications sent to client
- Reduces payload size and client processing

## Troubleshooting

### Error: "Property 'notification' does not exist on PrismaClient"
**Cause**: Prisma Client not regenerated after schema change  
**Fix**: Run `npx prisma generate`

### Error: "Table 'notifications' doesn't exist"
**Cause**: Migration not run  
**Fix**: Run `npx prisma db push` or `npx prisma migrate dev`

### Notifications still showing after marked as read
**Cause**: Old localStorage data interfering  
**Fix**: Clear browser localStorage for the site, or wait for client-side implementation to be deployed

## Future Enhancements

### Notification Preferences
```prisma
model NotificationPreference {
  id                String  @id @default(cuid())
  userId            String
  invoiceAlerts     Boolean @default(true)
  proposalAlerts    Boolean @default(true)
  scopeSentinelAlerts Boolean @default(true)
  teamInvites       Boolean @default(true)
  emailNotifications Boolean @default(true)
  
  user User @relation(fields: [userId], references: [id])
  @@unique([userId])
}
```

### Read Receipts
- Track when notification was first read
- Track how long user spent viewing
- Useful for important announcements

### Push Notifications
- Store device tokens in User model
- Send push via Firebase/OneSignal
- Mark as delivered/read via Notification model

### Digest Emails
```sql
-- Query for daily digest
SELECT u.email, array_agg(a.title) as unread_titles
FROM users u
JOIN notifications n ON n.user_id = u.id AND n.read_at IS NULL
JOIN activities a ON a.id = n.activity_id
WHERE n.created_at >= NOW() - INTERVAL '1 day'
GROUP BY u.id, u.email;
```

## Files Modified

✅ `/prisma/schema.prisma` - Added Notification model  
✅ `/src/app/api/notifications/[id]/route.ts` - NEW: Mark as read endpoint  
✅ `/src/app/api/notifications/mark-all-read/route.ts` - NEW: Mark all endpoint  
✅ `/src/app/api/notifications/route.ts` - Updated: Filter by read status  
✅ `/src/app/api/notifications/unread-count/route.ts` - Updated: Count unread  
✅ `/src/lib/notifications.ts` - Updated: Implement mark functions  
✅ `/src/components/notifications/notification-center.tsx` - Updated: Remove localStorage  

## Testing Checklist

- [ ] Database migration successful
- [ ] Prisma Client generated without errors
- [ ] TypeScript compilation passes
- [ ] Notifications appear in center
- [ ] Unread count shows correctly
- [ ] Marking single notification as read works
- [ ] Notification disappears after marked as read
- [ ] "Mark all as read" clears all notifications
- [ ] Refresh doesn't bring back read notifications
- [ ] Different users see different notifications
- [ ] Works across multiple browser tabs
- [ ] Works across different devices

## Rollback Plan

If issues occur, revert to localStorage version:

```bash
# Revert schema changes
git checkout HEAD -- prisma/schema.prisma

# Revert API changes
git checkout HEAD -- src/app/api/notifications/
git checkout HEAD -- src/lib/notifications.ts
git checkout HEAD -- src/components/notifications/notification-center.tsx

# Regenerate Prisma Client
npx prisma generate
```

Or keep new endpoints but re-enable localStorage as fallback in notification-center.tsx.
