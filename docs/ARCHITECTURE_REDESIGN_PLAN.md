# Nesternity Architecture Redesign Plan

## Overview
Complete architectural transformation from team-based to organization-centric model, similar to Supabase's multi-tenant structure.

## Current Architecture
```
/dashboard
  ├── /clients
  ├── /projects
  ├── /teams
  ├── /proposals
  ├── /contracts
  ├── /invoices
  ├── /issues
  └── /settings
```

## New Architecture
```
/dashboard
  └── /organisation (list view with tabs: Your Organisation | Client Organisations)
      ├── /[id] (Your organisation dashboard - create projects)
      │   └── /projects
      │       └── /[projectId]
      │           ├── page.tsx (project dashboard)
      │           ├── /teams
      │           ├── /proposals
      │           ├── /contracts
      │           ├── /invoices
      │           └── /issues
      └── /[client_id] (Client organisation dashboard)
          └── /projects
              └── /[projectId]
                  ├── page.tsx (project dashboard)
                  ├── /teams
                  ├── /proposals
                  ├── /contracts
                  ├── /invoices
                  └── /issues
```

## Database Schema Changes

### New Models

#### Organisation
```prisma
model Organisation {
  id              String              @id @default(cuid())
  name            String
  email           String
  phone           String?
  budget          Float?
  currency        String?             @default("INR")
  status          OrganisationStatus  @default(ACTIVE)
  type            OrganisationType    // OWNER or CLIENT
  notes           String?
  
  // Owner info
  ownerId         String              @map("owner_id")
  owner           User                @relation("UserOrganisations", fields: [ownerId], references: [id])
  
  // Relationships
  projects        Project[]           @relation("OrganisationProjects")
  
  // Subscription limits
  maxProjects     Int                 @default(5) @map("max_projects")
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  @@index([ownerId])
  @@index([type])
  @@index([status])
  @@map("organisations")
}

enum OrganisationType {
  OWNER   // User's own organisation
  CLIENT  // Client organisation
}

enum OrganisationStatus {
  PROSPECT
  ACTIVE
  INACTIVE
}
```

### Modified Models

#### Project (Updated)
- Add `organisationId` field
- Remove direct `clientId` relation
- Organisation owns projects, projects can have client context

#### User (Updated)
- Add `organisations` relation

#### Client (Deprecated/Transformed)
- Merge into Organisation model with type=CLIENT

## Implementation Steps

### Phase 1: Database Schema Update ✅
1. Add Organisation model
2. Update Project model with organisationId
3. Create migration
4. Seed initial data transformation

### Phase 2: API Routes
1. `/api/organisations` - CRUD for organisations
2. `/api/organisations/[id]/projects` - Projects under organisation
3. Update existing project APIs to work with organisation context

### Phase 3: UI Components
1. `OrganisationModal` (Create/Edit organisation)
2. `ClientModal` (Create/Edit client organisation)
3. `OrganisationList` (Tabs: Your Org | Client Orgs)
4. `ProjectModal` (Create project under organisation)
5. `ProjectList` (Projects under organisation)
6. Breadcrumb with Combobox (Supabase-style)
7. Hover sidebar (Supabase-style)

### Phase 4: Page Structure
1. `/dashboard/organisation/page.tsx` - Organisation list
2. `/dashboard/organisation/[id]/page.tsx` - Organisation dashboard
3. `/dashboard/organisation/[id]/projects/[projectId]/*` - Project pages
4. New layouts with proper breadcrumb navigation

### Phase 5: Migration & Cleanup
1. Data migration script (Client → Organisation)
2. Remove old `/dashboard/clients` route
3. Remove old `/dashboard/projects` route (top level)
4. Update all internal links
5. Remove unused documentation files

### Phase 6: Subscription Integration
1. Add organisation count limits based on subscription
2. Middleware to check organisation creation limits
3. UI warnings when approaching limits

## Subscription Limits

```typescript
type SubscriptionLimits = {
  free: {
    maxOrganisations: 2,      // 1 own + 1 client
    maxProjectsPerOrg: 2
  },
  pro: {
    maxOrganisations: 10,     // 1 own + 9 clients
    maxProjectsPerOrg: 20
  },
  enterprise: {
    maxOrganisations: -1,     // Unlimited
    maxProjectsPerOrg: -1     // Unlimited
  }
}
```

## UI/UX Improvements

### Header (Supabase-style)
- Breadcrumb with combobox for organisation switching
- User avatar dropdown with settings
- Global search
- Notification bell

### Sidebar (Hover-reveal like Supabase)
- Auto-hide on mouse out
- Icons-only collapsed state
- Full menu on hover
- Project-specific navigation

### Organisation Dashboard
- Create project CTA
- Project list with status
- Quick stats
- Recent activity

## Migration Strategy

### Step 1: Add New Schema (Non-breaking)
- Add Organisation model
- Keep Client model temporarily
- Projects reference both for transition period

### Step 2: Data Migration Script
```typescript
// Convert all clients to organisations
const clients = await prisma.client.findMany();
for (const client of clients) {
  await prisma.organisation.create({
    data: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      budget: client.budget,
      currency: client.currency,
      status: client.status,
      type: 'CLIENT',
      ownerId: client.createdBy,
      notes: client.notes
    }
  });
}
```

### Step 3: Update Projects
```typescript
// Link projects to organisations
const projects = await prisma.project.findMany();
for (const project of projects) {
  if (project.clientId) {
    const org = await prisma.organisation.findFirst({
      where: { 
        type: 'CLIENT',
        // Find matching client org
      }
    });
    await prisma.project.update({
      where: { id: project.id },
      data: { organisationId: org.id }
    });
  }
}
```

### Step 4: Remove Old Routes
- Remove `/dashboard/clients/*`
- Remove `/dashboard/projects/*` (top level)
- Add redirects to new structure

## Breaking Changes

1. **URL Structure**: Complete URL restructure
2. **API Endpoints**: New organisation-centric endpoints
3. **Database Relations**: Client → Organisation migration
4. **Navigation**: New breadcrumb-based navigation

## Backward Compatibility

During transition period:
1. Keep old API routes working with deprecation warnings
2. Add redirects from old URLs to new structure
3. Maintain dual-write to both Client and Organisation models
4. After 2 weeks, remove old code

## Testing Checklist

- [ ] Organisation CRUD operations
- [ ] Project creation under organisation
- [ ] Navigation between orgs and projects
- [ ] Subscription limit enforcement
- [ ] Data migration script
- [ ] Old URL redirects
- [ ] Team access within organisation context
- [ ] Invoice/Proposal generation in new structure

## Rollback Plan

If issues arise:
1. Feature flag to toggle between old/new architecture
2. Database migration rollback script
3. Keep old routes available for 1 month
4. Gradual user migration (optional beta testing)

---

**Estimated Timeline**: 5-7 days
**Risk Level**: HIGH (major structural change)
**Recommended Approach**: Incremental rollout with feature flags
