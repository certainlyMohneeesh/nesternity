# Auth Import Fix - Organisation Routes

## Problem
The organisation API routes were trying to import a non-existent `getUser` helper from `@/lib/auth`, which was just a placeholder file with no exports.

**Error:**
```
Export getUser doesn't exist in target module
./src/app/api/organisations/route.ts:3:1
```

## Solution
Updated all organisation routes to use Supabase authentication directly, following the same pattern as other API routes in the application.

## Files Modified (4)

### 1. `/src/app/api/organisations/route.ts`
- **Changed:** Removed `getUser` import
- **Added:** Supabase client initialization
- **Updated:** GET and POST handlers to use `supabase.auth.getUser(token)`

### 2. `/src/app/api/organisations/[id]/route.ts`  
- **Changed:** Removed `getUser` import
- **Added:** Supabase client initialization
- **Updated:** GET, PATCH, and DELETE handlers to use `supabase.auth.getUser(token)`

### 3. `/src/app/api/organisations/[id]/projects/route.ts`
- **Changed:** Removed `getUser` import
- **Added:** Supabase client initialization
- **Updated:** GET and POST handlers to use `supabase.auth.getUser(token)`

### 4. `/src/app/api/organisations/[id]/stats/route.ts`
- **Changed:** Removed `getUser` import
- **Added:** Supabase client initialization
- **Updated:** GET handler to use `supabase.auth.getUser(token)`

## Authentication Pattern Used

All routes now use the standard authentication pattern:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Continue with authenticated user
  } catch (error) {
    // Error handling
  }
}
```

## Prisma Client Regeneration

After fixing the imports, the Prisma client was regenerated to ensure the `Organisation` model is available:

```bash
npx prisma generate
```

This generated the Prisma client with the Organisation model, resolving any compilation errors related to `prisma.organisation`.

## Status

✅ **All import errors fixed**
✅ **Prisma client regenerated**  
✅ **Authentication pattern consistent across all routes**
✅ **Build should now complete successfully**

## Testing

To verify the fix:

1. **Start dev server:**
   ```bash
   pnpm run dev
   ```

2. **Test organisation endpoints:**
   ```bash
   # Get organisations (requires auth token)
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/organisations
   ```

3. **Verify no import errors in browser console or terminal**

## Related Files

- `/src/lib/auth.ts` - Placeholder file (can be populated with shared auth helpers later)
- `/src/lib/prisma.ts` - Prisma client initialization
- All `/src/app/api/organisations/**/route.ts` files - Updated with new auth pattern

## Next Steps

If you want to create the `getUser` helper for cleaner code:

```typescript
// src/lib/auth.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}
```

Then you could use it like before:
```typescript
const user = await getUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

**Fixed:** November 13, 2025  
**Status:** ✅ Resolved
