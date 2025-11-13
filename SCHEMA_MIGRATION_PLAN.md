# Schema Migration Plan: Add organisationId to All Models

## Overview
Adding `organisationId` to all models for proper multi-tenancy and data isolation following industry standards.

## Current Issues
- **Teams, Boards, Invoices, Proposals, Issues, Clients** lack direct `organisationId` reference
- Data isolation relies on complex joins through Projects
- Risk of data leakage across organizations
- Performance issues due to nested queries

## Target Architecture
Every organization-scoped model should have:
```prisma
organisationId String? @map("organisation_id")
organisation   Organisation? @relation("RelationName", fields: [organisationId], references: [id], onDelete: Cascade)

@@index([organisationId])
```

## Models to Update

### 1. Team Model
**Current State:**
```prisma
model Team {
  id          String       @id @default(cuid())
  name        String
  description String?
  createdBy   String       @map("created_by")
  // ... other fields
}
```

**Updated State:**
```prisma
model Team {
  id             String        @id @default(cuid())
  name           String
  description    String?
  createdBy      String        @map("created_by")
  organisationId String?       @map("organisation_id")  // NEW
  organisation   Organisation? @relation("OrganisationTeams", fields: [organisationId], references: [id], onDelete: Cascade)
  // ... other fields
  
  @@index([organisationId])
}
```

**Migration Strategy:**
- Add nullable column initially
- For existing teams: Set `organisationId` based on first project they belong to
- SQL: `UPDATE teams t SET organisation_id = (SELECT p.organisation_id FROM projects p WHERE p.team_id = t.id LIMIT 1)`

### 2. Board Model
**Current State:**
```prisma
model Board {
  id          String    @id @default(cuid())
  name        String
  teamId      String    @map("team_id")
  projectId   String?   @map("project_id")
  // ... other fields
}
```

**Updated State:**
```prisma
model Board {
  id             String        @id @default(cuid())
  name           String
  teamId         String        @map("team_id")
  projectId      String?       @map("project_id")
  organisationId String?       @map("organisation_id")  // NEW
  organisation   Organisation? @relation("OrganisationBoards", fields: [organisationId], references: [id], onDelete: Cascade)
  // ... other fields
  
  @@index([organisationId])
  @@index([organisationId, teamId])  // Composite for faster filtering
}
```

**Migration Strategy:**
- Add nullable column
- Set from projectId: `UPDATE boards b SET organisation_id = (SELECT p.organisation_id FROM projects p WHERE p.id = b.project_id)`
- For boards without projectId, use teamId: `UPDATE boards b SET organisation_id = (SELECT t.organisation_id FROM teams t WHERE t.id = b.team_id) WHERE b.organisation_id IS NULL`

### 3. Invoice Model
**Current State:**
```prisma
model Invoice {
  id            String   @id @default(cuid())
  invoiceNumber String   @unique
  clientId      String   @map("client_id")
  issuedById    String   @map("issued_by_id")
  // ... other fields
}
```

**Updated State:**
```prisma
model Invoice {
  id             String        @id @default(cuid())
  invoiceNumber  String        @unique
  clientId       String        @map("client_id")
  issuedById     String        @map("issued_by_id")
  organisationId String?       @map("organisation_id")  // NEW
  organisation   Organisation? @relation("OrganisationInvoices", fields: [organisationId], references: [id], onDelete: Cascade)
  // ... other fields
  
  @@index([organisationId])
  @@index([organisationId, status, issuedDate(sort: Desc)])  // For dashboard queries
}
```

**Migration Strategy:**
- Add nullable column
- Set from client: `UPDATE invoices i SET organisation_id = (SELECT c.organisation_id FROM clients c WHERE c.id = i.client_id)`
- May need manual mapping if clients don't have organisationId yet

### 4. Proposal Model
**Current State:**
```prisma
model Proposal {
  id        String   @id @default(cuid())
  clientId  String   @map("client_id")
  projectId String?  @map("project_id")
  // ... other fields
}
```

**Updated State:**
```prisma
model Proposal {
  id             String        @id @default(cuid())
  clientId       String        @map("client_id")
  projectId      String?       @map("project_id")
  organisationId String?       @map("organisation_id")  // NEW
  organisation   Organisation? @relation("OrganisationProposals", fields: [organisationId], references: [id], onDelete: Cascade)
  // ... other fields
  
  @@index([organisationId])
  @@index([organisationId, status, createdAt(sort: Desc)])
}
```

**Migration Strategy:**
- Add nullable column
- Set from projectId: `UPDATE proposals p SET organisation_id = (SELECT pr.organisation_id FROM projects pr WHERE pr.id = p.project_id)`
- For proposals without project, use client: `UPDATE proposals p SET organisation_id = (SELECT c.organisation_id FROM clients c WHERE c.id = p.client_id) WHERE p.organisation_id IS NULL`

### 5. Issue Model
**Current State:**
```prisma
model Issue {
  id          String   @id @default(cuid())
  title       String
  projectId   String?  @map("project_id")
  boardId     String?  @map("board_id")
  taskId      String?  @map("task_id")
  // ... other fields
}
```

**Updated State:**
```prisma
model Issue {
  id             String        @id @default(cuid())
  title          String
  projectId      String?       @map("project_id")
  boardId        String?       @map("board_id")
  taskId         String?       @map("task_id")
  organisationId String?       @map("organisation_id")  // NEW
  organisation   Organisation? @relation("OrganisationIssues", fields: [organisationId], references: [id], onDelete: Cascade)
  // ... other fields
  
  @@index([organisationId])
  @@index([organisationId, status, priority])
}
```

**Migration Strategy:**
- Add nullable column
- Set from projectId: `UPDATE issues i SET organisation_id = (SELECT p.organisation_id FROM projects p WHERE p.id = i.project_id)`
- Set from boardId if no project: `UPDATE issues i SET organisation_id = (SELECT b.organisation_id FROM boards b WHERE b.id = i.board_id) WHERE i.organisation_id IS NULL`

### 6. Client Model
**Current State:**
```prisma
model Client {
  id        String   @id @default(cuid())
  name      String
  email     String
  createdBy String   @map("created_by")
  // ... other fields
}
```

**Updated State:**
```prisma
model Client {
  id             String        @id @default(cuid())
  name           String
  email          String
  createdBy      String        @map("created_by")
  organisationId String?       @map("organisation_id")  // NEW
  organisation   Organisation? @relation("OrganisationClients", fields: [organisationId], references: [id], onDelete: Cascade)
  // ... other fields
  
  @@index([organisationId])
  @@index([organisationId, status, createdAt(sort: Desc)])
}
```

**Migration Strategy:**
- Add nullable column
- Derive from user's primary organisation: `UPDATE clients c SET organisation_id = (SELECT o.id FROM organisations o WHERE o.owner_id = c.created_by LIMIT 1)`
- This assumes each user has a primary organisation - may need adjustment

## Migration Steps

### Phase 1: Schema Update
1. Update `schema.prisma` with all new fields
2. Add relation definitions to Organisation model
3. Generate migration: `npx prisma migrate dev --name add_organisation_id_to_all_models`

### Phase 2: Data Migration
Create a script `scripts/migrate-organisation-ids.js`:
```javascript
// Migrate organisationId for all models
// 1. Teams from projects
// 2. Boards from projects/teams
// 3. Clients from user's org
// 4. Invoices from clients
// 5. Proposals from projects/clients
// 6. Issues from projects/boards
```

### Phase 3: API Route Updates
Update all API routes to:
1. **Accept** organisationId in query/body
2. **Filter** all queries by organisationId
3. **Include** organisationId when creating records
4. **Validate** organisationId matches user's access

Examples:
```typescript
// GET /api/teams
where: {
  organisationId,
  OR: [
    { createdBy: userId },
    { members: { some: { userId } } }
  ]
}

// POST /api/teams
data: {
  ...teamData,
  organisationId  // Include when creating
}

// GET /api/invoices
where: {
  organisationId,
  status: filters.status
}
```

### Phase 4: Component Updates
Update all pages and components to:
1. Extract `orgId` from URL params
2. Pass to API calls
3. Include in mutation data

### Phase 5: Testing
1. **Unit Tests**: Each API route filters correctly
2. **Integration Tests**:
   - Create item in Org A → Not visible in Org B
   - Update item → Validates organisationId
   - Delete item → Validates organisationId
3. **E2E Tests**: Navigate between orgs, verify isolation

### Phase 6: Performance
1. Add composite indexes for common queries
2. Monitor query performance
3. Optimize slow queries

## API Routes to Update

### Teams
- ✅ `GET /api/teams` - Filter by organisationId
- ✅ `POST /api/teams` - Include organisationId
- ✅ `PUT /api/teams/[id]` - Validate organisationId
- ✅ `DELETE /api/teams/[id]` - Validate organisationId

### Boards
- ✅ `GET /api/boards` - Filter by organisationId
- ✅ `POST /api/boards` - Include organisationId
- Similar for update/delete

### Invoices
- ✅ `GET /api/invoices` - Filter by organisationId
- ✅ `POST /api/invoices` - Include organisationId
- ✅ `GET /api/invoices/[id]` - Validate organisationId

### Proposals
- ✅ `GET /api/proposals` - Filter by organisationId
- ✅ `POST /api/proposals` - Include organisationId

### Issues
- ✅ `GET /api/issues` - Filter by organisationId
- ✅ `POST /api/issues` - Include organisationId

### Clients
- ✅ `GET /api/clients` - Filter by organisationId
- ✅ `POST /api/clients` - Include organisationId

## Benefits

1. **Simplified Queries**: Direct filter instead of complex joins
2. **Better Performance**: Indexes on organisationId
3. **Data Security**: Explicit isolation at database level
4. **Industry Standard**: Multi-tenancy best practice
5. **Future-Proof**: Easy to add org-level features
6. **Debugging**: Easier to trace data ownership

## Rollback Plan

If migration fails:
1. Keep old migration file
2. Create rollback migration to drop columns
3. Restore from backup if needed
4. Keep old API routes until verified

## Timeline

- **Schema Update**: 30 minutes
- **Data Migration Script**: 1 hour
- **Test Migration**: 30 minutes
- **API Route Updates**: 3-4 hours
- **Component Updates**: 2 hours
- **Testing**: 2-3 hours
- **Total**: 1-2 days

## Next Steps

1. Review this plan
2. Backup production database
3. Test migration on development
4. Update schema.prisma
5. Generate migration
6. Create data migration script
7. Update API routes systematically
8. Test thoroughly
9. Deploy to production
