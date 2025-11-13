# UI Integration Guide - OrganisationId Implementation

## ✅ Completed UI Updates

### 1. Teams Page ✅
**File:** `/src/app/dashboard/organisation/[id]/projects/[projectId]/teams/page.tsx`

**Changes Made:**
- Added `organisationId` to GET request: `?organisationId=${orgId}`
- Added `organisationId` to POST request body when creating teams
- Teams now properly scoped to organisation

**Code Example:**
```typescript
// GET Teams
const response = await fetch(`/api/teams?organisationId=${orgId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// POST Team
const response = await fetch('/api/teams', {
  method: 'POST',
  body: JSON.stringify({
    name: teamName,
    description: teamDescription,
    organisationId: orgId  // ✅ Added
  })
});
```

---

### 2. Invoices Page ✅
**File:** `/src/app/dashboard/organisation/[id]/projects/[projectId]/invoices/page.tsx`

**Changes Made:**
- Added `organisationId` to query params when fetching invoices
- Updated `InvoiceForm` component to accept and use `organisationId`
- Invoices now properly scoped to organisation

**Code Example:**
```typescript
// Invoices Page
const params = new URLSearchParams();
params.append('organisationId', orgId);  // ✅ Added
const response = await fetch(`/api/invoices?${params}`);

// InvoiceForm Component
<InvoiceForm
  organisationId={orgId}  // ✅ Added
  onSuccess={handleFormSuccess}
/>
```

---

### 3. InvoiceForm Component ✅
**File:** `/src/components/invoices/InvoiceForm.tsx`

**Changes Made:**
- Added `organisationId` prop to interface
- Include `organisationId` in POST payload
- Invoice creation now associates with organisation

**Code Example:**
```typescript
interface InvoiceFormProps {
  teamId?: string;
  organisationId?: string;  // ✅ Added
  clients?: Client[];
  onSuccess?: () => void;
}

// In onSubmit
const payload = {
  ...data,
  organisationId  // ✅ Added
};
```

---

## 🔨 Utility Hook Created

**File:** `/src/hooks/use-route-params.ts`

A reusable hook to extract route parameters:

```typescript
import { useRouteParams } from '@/hooks/use-route-params';

// In any page component
const { organisationId, projectId } = useRouteParams();
```

---

## 📋 Remaining Pages to Update

### 1. Proposals Page
**File:** `/src/app/dashboard/organisation/[id]/projects/[projectId]/proposals/page.tsx`

**Required Changes:**
```typescript
// Import hook
import { useRouteParams } from '@/hooks/use-route-params';

// Extract params
const { organisationId, projectId } = useRouteParams();

// Update fetch
const response = await fetch(
  `/api/ai/proposal/save?organisationId=${organisationId}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

// Update create form - if there's a ProposalForm component
<ProposalForm
  organisationId={organisationId}
  projectId={projectId}
  onSuccess={handleFormSuccess}
/>
```

---

### 2. Issues Page  
**File:** `/src/app/dashboard/organisation/[id]/projects/[projectId]/issues/page.tsx`

**Required Changes:**
```typescript
// Import hook
import { useRouteParams } from '@/hooks/use-route-params';

// Extract params
const { organisationId, projectId } = useRouteParams();

// Update fetch
const params = new URLSearchParams();
params.append('organisationId', organisationId);
params.append('projectId', projectId);  // Also useful for filtering
const response = await fetch(`/api/issues?${params}`);

// Update create
const createIssue = async (data) => {
  await fetch('/api/issues', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      organisationId,
      projectId
    })
  });
};
```

---

### 3. Clients Page
**File:** Check if there's a clients page or if it's embedded

**Required Changes:**
```typescript
// Fetch clients
const response = await fetch(
  `/api/clients?organisationId=${organisationId}`
);

// Create client
const createClient = async (data) => {
  await fetch('/api/clients', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      organisationId
    })
  });
};
```

---

### 4. Boards (If separate page exists)
**File:** Check for boards page

**Required Changes:**
```typescript
// Fetch boards
const response = await fetch(
  `/api/boards?organisationId=${organisationId}&teamId=${teamId}`
);

// Create board
const createBoard = async (data) => {
  await fetch('/api/boards', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      organisationId,
      teamId,
      projectId
    })
  });
};
```

---

## 🎯 Pattern to Follow

For any feature page, follow this pattern:

### Step 1: Extract Route Params
```typescript
import { useRouteParams } from '@/hooks/use-route-params';

export default function FeaturePage() {
  const { organisationId, projectId } = useRouteParams();
  // ...
}
```

### Step 2: Add to GET Requests
```typescript
const fetchData = async () => {
  const params = new URLSearchParams();
  params.append('organisationId', organisationId);
  
  const response = await fetch(`/api/feature?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

### Step 3: Add to POST/PUT Requests
```typescript
const createItem = async (data) => {
  const response = await fetch('/api/feature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...data,
      organisationId  // Include in payload
    })
  });
};
```

### Step 4: Pass to Form Components
```typescript
<FeatureForm
  organisationId={organisationId}
  projectId={projectId}
  onSuccess={handleSuccess}
/>
```

---

## ✅ Testing Checklist

After updating each page, test the following:

### Data Isolation Test
1. **Create item in Org A**
   - Navigate to Org A → Project X → Feature page
   - Create a new item (team/invoice/proposal/etc)
   - Verify it appears in the list

2. **Verify NOT in Org B**
   - Navigate to Org B → Project Y → Same feature page
   - Verify the item from Org A does NOT appear
   - Create a new item in Org B
   - Verify it appears only in Org B

3. **Switch back to Org A**
   - Navigate back to Org A → Project X
   - Verify only Org A items appear
   - Verify Org B items do NOT appear

### CRUD Operations Test
For each feature:
- [ ] **Create** - Item is created with correct organisationId
- [ ] **Read** - Only items from current org are visible
- [ ] **Update** - Can update items from current org
- [ ] **Delete** - Can delete items from current org
- [ ] **Cross-org access** - Cannot access items from different org

---

## 🐛 Debugging Tips

### If items don't appear after creation:
1. Check browser DevTools → Network tab
2. Verify POST request includes `organisationId` in body
3. Check response - item should have `organisationId` field
4. Verify GET request includes `organisationId` in query params

### If items from other orgs appear:
1. Check GET request URL - should include `?organisationId=XXX`
2. Verify the orgId matches the current route
3. Check API route filtering logic

### Console Logging
Add these logs for debugging:
```typescript
console.log('[FeaturePage] Fetching with orgId:', organisationId);
console.log('[FeaturePage] Response data:', data);
console.log('[FeaturePage] Items count:', items.length);
```

---

## 📊 Progress Tracker

| Feature | Page Updated | Form Updated | Tested | Status |
|---------|--------------|--------------|--------|--------|
| Teams | ✅ | ✅ | ⏳ | **READY** |
| Invoices | ✅ | ✅ | ⏳ | **READY** |
| Proposals | ⏳ | ⏳ | ⏳ | **TODO** |
| Issues | ⏳ | ⏳ | ⏳ | **TODO** |
| Clients | ⏳ | ⏳ | ⏳ | **TODO** |
| Boards | ⏳ | ⏳ | ⏳ | **TODO** |

---

## 🚀 Quick Win - Use the Hook Everywhere

Replace this pattern:
```typescript
const params = useParams();
const orgId = params.id as string;
const projectId = params.projectId as string;
```

With this:
```typescript
import { useRouteParams } from '@/hooks/use-route-params';

const { organisationId, projectId } = useRouteParams();
```

Benefits:
- ✅ Less boilerplate
- ✅ Consistent naming
- ✅ Type-safe
- ✅ One line instead of three

---

## 🎓 Example: Complete Proposals Page Update

```typescript
"use client";

import { useState, useEffect } from 'react';
import { useRouteParams } from '@/hooks/use-route-params';
import { getSessionToken } from '@/lib/supabase/client-session';

export default function ProposalsPage() {
  // ✅ Step 1: Extract route params
  const { organisationId, projectId } = useRouteParams();
  
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Step 2: Fetch with organisationId
  const fetchProposals = async () => {
    const token = await getSessionToken();
    const response = await fetch(
      `/api/ai/proposal/save?organisationId=${organisationId}&projectId=${projectId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    setProposals(data.proposals || []);
  };

  // ✅ Step 3: Create with organisationId
  const createProposal = async (proposalData) => {
    const token = await getSessionToken();
    const response = await fetch('/api/ai/proposal/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...proposalData,
        organisationId,  // ✅ Include
        projectId
      })
    });
    
    if (response.ok) {
      await fetchProposals();  // Refresh list
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [organisationId, projectId]);  // Re-fetch when org/project changes

  // ... rest of component
}
```

---

## 📝 Summary

**Completed:**
- ✅ Teams page with org filtering
- ✅ Invoices page with org filtering
- ✅ InvoiceForm component updated
- ✅ Utility hook created

**Next Steps:**
1. Update Proposals page (following example above)
2. Update Issues page
3. Update Clients page/component
4. Update Boards page (if exists)
5. Test data isolation thoroughly
6. Deploy and monitor

**Key Principle:**
> **Every API call must include `organisationId` for proper data isolation**

This ensures multi-tenancy works correctly and different organisations cannot access each other's data.
