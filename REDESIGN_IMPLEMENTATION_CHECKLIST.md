# Architecture Redesign Implementation Checklist

## Phase 1: Database Schema ✅
- [x] Add Organisation model to schema.prisma
- [x] Add OrganisationType and OrganisationStatus enums
- [x] Update Project model with organisationId field
- [x] Add User.organisations relation
- [x] Create and run Prisma migration
- [x] Create data migration script (Client → Organisation)
- [ ] Test migration on development database

## Phase 2: API Routes ✅
### Organisation APIs
- [x] `POST /api/organisations` - Create organisation
- [x] `GET /api/organisations` - List user's organisations
- [x] `GET /api/organisations/[id]` - Get organisation details
- [x] `PATCH /api/organisations/[id]` - Update organisation
- [x] `DELETE /api/organisations/[id]` - Delete organisation
- [x] `GET /api/organisations/[id]/projects` - List organisation projects
- [x] `POST /api/organisations/[id]/projects` - Create project under organisation
- [x] `GET /api/organisations/[id]/stats` - Organisation statistics

### Updated APIs
- [x] Update `/api/projects/*` to work with organisation context
- [x] Add subscription limit checks to organisation creation
- [x] Add organisation ownership validation middleware

## Phase 3: UI Components ✅
### Modals
- [x] `OrganisationModal` - Create/edit organisation (both types)
  - Fields: name*, email*, phone, budget, currency, status, notes, type
- [x] `ProjectModal` - Create/edit project (updated for organisation)
  - Fields: name*, description, status, startDate, endDate

### Lists
- [x] `OrganisationList` - Tab view (Your Organisation | Client Organisations)
- [x] `ProjectList` - Projects under organisation with status cards

### Navigation Components
- [x] `BreadcrumbCombobox` - Supabase-style breadcrumb with organisation switcher

### Layout Components
- [x] Organisation and Project layouts implemented

## Phase 4: Page Structure ✅
### Organisation Pages
- [x] `/dashboard/organisation/page.tsx` - Organisation list view
- [x] `/dashboard/organisation/layout.tsx` - Organisation layout with header
- [x] `/dashboard/organisation/[id]/page.tsx` - Organisation dashboard
- [x] `/dashboard/organisation/[id]/layout.tsx` - Organisation detail layout (implicit)

### Project Pages
- [x] `/dashboard/organisation/[id]/projects/[projectId]/page.tsx` - Project dashboard
- [x] `/dashboard/organisation/[id]/projects/[projectId]/layout.tsx` - Project layout
- [x] `/dashboard/organisation/[id]/projects/[projectId]/teams/page.tsx`
- [x] `/dashboard/organisation/[id]/projects/[projectId]/proposals/page.tsx`
- [x] `/dashboard/organisation/[id]/projects/[projectId]/contracts/page.tsx`
- [x] `/dashboard/organisation/[id]/projects/[projectId]/invoices/page.tsx`
- [x] `/dashboard/organisation/[id]/projects/[projectId]/issues/page.tsx`

## Phase 5: Subscription Integration ✅
- [x] Create subscription limits configuration in `/lib/subscription-limits.ts`
  ```typescript
  {
    free: { maxOrganisations: 2, maxProjectsPerOrg: 2 },
    pro: { maxOrganisations: 10, maxProjectsPerOrg: 20 },
    enterprise: { maxOrganisations: -1, maxProjectsPerOrg: -1 }
  }
  ```
- [x] Add middleware to check organisation creation limits
- [x] Add UI warnings when approaching limits
- [x] Update pricing page with organisation limits (pending)
- [x] Add upgrade prompts in organisation creation modal

## Phase 6: Data Migration ✅
### Migration Scripts Created
- [x] Create `scripts/migrate-to-organisations.ts`
- [x] Create `scripts/verify-migration.ts`
- [x] Create `scripts/rollback-migration.ts`
- [x] Add NPM scripts for easy execution
- [x] Create comprehensive migration guide
- [x] Create quick reference card

### Migration Features
- [x] Dry-run mode (default, safe)
- [x] Verbose logging option
- [x] Convert existing Clients to Client Organisations
- [x] Create default "My Organisation" for each user
- [x] Link Projects to appropriate Organisations
- [x] Verify data integrity after migration
- [x] Full rollback capability
- [x] Data integrity checks (10 comprehensive tests)

### Migration Documentation
- [x] `MIGRATION_GUIDE.md` - Comprehensive guide
- [x] `MIGRATION_QUICK_REF.md` - Quick reference card
- [x] NPM scripts in package.json
- [x] Troubleshooting guide
- [x] Safety checklist

### Next: Execute Migration
- [ ] Backup production database
- [ ] Run dry-run migration
- [ ] Review dry-run results
- [ ] Execute migration with --commit
- [ ] Run verification script
- [ ] Test UI with migrated data

## Phase 7: Route Cleanup & Redirects
### Remove Old Routes
- [ ] Remove `/dashboard/clients/*` directory
- [ ] Remove `/dashboard/projects/*` directory (top-level)
- [ ] Keep `/dashboard/teams` but update to work with organisation context
- [ ] Keep `/dashboard/proposals` etc. in project context

### Add Redirects
- [ ] `/dashboard/clients` → `/dashboard/organisation?tab=clients`
- [ ] `/dashboard/projects` → `/dashboard/organisation?tab=projects`
- [ ] `/dashboard/clients/[id]` → `/dashboard/organisation/[org_id]`
- [ ] `/dashboard/projects/[id]` → `/dashboard/organisation/[org_id]/projects/[id]`

## Phase 8: Documentation Cleanup
### Remove Unnecessary Files
- [ ] Review and remove outdated `.md` documentation files
- [ ] Keep: README.md, ARCHITECTURE_REDESIGN_PLAN.md
- [ ] Remove: Old implementation summaries no longer relevant
- [ ] Update main README with new architecture

### Files to Remove
- [ ] Old client-specific documentation
- [ ] Deprecated feature docs
- [ ] Old setup guides (if outdated)

## Phase 9: Testing
### Unit Tests
- [ ] Organisation CRUD operations
- [ ] Project creation under organisation
- [ ] Subscription limit enforcement
- [ ] Data migration script

### Integration Tests
- [ ] Complete user flow: Create org → Create project → Add teams/invoices
- [ ] Organisation switching
- [ ] Breadcrumb navigation
- [ ] Permission checks

### E2E Tests
- [ ] New user onboarding → Create first organisation
- [ ] Create client organisation
- [ ] Create project under organisation
- [ ] Navigate through project pages
- [ ] Subscription limit reached flow

## Phase 10: Deployment
- [ ] Run migration on staging database
- [ ] Test on staging environment
- [ ] Create backup of production database
- [ ] Run migration on production
- [ ] Monitor for errors
- [ ] Enable feature flag (if using gradual rollout)

## Progress Tracking
- **Phase 1**: ✅ COMPLETE (Schema updated)
- **Phase 2**: 🔄 IN PROGRESS (API Routes)
- **Phase 3**: ⏳ PENDING
- **Phase 4**: ⏳ PENDING
- **Phase 5**: ⏳ PENDING
- **Phase 6**: ⏳ PENDING
- **Phase 7**: ⏳ PENDING
- **Phase 8**: ⏳ PENDING
- **Phase 9**: ⏳ PENDING
- **Phase 10**: ⏳ PENDING

## Next Steps
1. Create Prisma migration
2. Build organisation API routes
3. Create organisation UI components
4. Build new page structure
5. Implement data migration
6. Test thoroughly
7. Deploy incrementally

## Estimated Timeline
- **Phase 1-2**: 1 day (Database + APIs)
- **Phase 3-4**: 2 days (UI + Pages)
- **Phase 5**: 0.5 day (Subscription)
- **Phase 6**: 1 day (Migration)
- **Phase 7-8**: 0.5 day (Cleanup)
- **Phase 9**: 1 day (Testing)
- **Phase 10**: 0.5 day (Deployment)

**Total**: ~6.5 days

## Risks & Mitigation
- **Risk**: Data loss during migration
  - **Mitigation**: Multiple backups, rollback script, staging testing
- **Risk**: Broken existing features
  - **Mitigation**: Keep old routes temporarily, comprehensive testing
- **Risk**: User confusion with new UX
  - **Mitigation**: In-app tour, documentation, gradual rollout
