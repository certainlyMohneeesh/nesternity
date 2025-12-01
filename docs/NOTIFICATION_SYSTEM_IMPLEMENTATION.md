# Notification System Implementation

## Overview

This document outlines the implementation of a **Notion-like Inbox Notification System** for Nesternity. The system provides real-time, actionable notifications that help users stay informed about important events across their teams, projects, and work.

## Notification Types

### 1. Team Invite Notifications
**When:** A user is invited to join a team
**Who receives:** The invited user (by email lookup)
**Action:** Direct link to accept/join the team
**Data:**
- Team name and description
- Inviter's name
- Role being offered
- Accept link with invite token

### 2. Scope Radar/Budget Alerts
**When:**
- Scope creep is detected in a project
- Budget reaches warning threshold (80%)
- Budget is exceeded (100%+)
- Change order is required

**Who receives:** Project owner, team admins
**Action:** View project scope radar, send client warning email
**Data:**
- Project name
- Risk level (low/medium/high/critical)
- Budget info (original, current, overrun)
- Recommendations

### 3. Recurring Invoice Notifications
**When:**
- Recurring invoice is auto-generated
- Recurring invoice generation fails
- Invoice is sent to client

**Who receives:** Invoice creator, team admins
**Action:** View invoice, retry generation
**Data:**
- Invoice number
- Client name
- Amount and currency
- Due date

### 4. Task Assignment Notifications
**When:** A task is assigned to a user
**Who receives:** The assigned user
**Action:** View task in board
**Data:**
- Task title and description
- Board and list name
- Due date
- Priority
- Assigner's name

## Database Schema Changes

### Enhanced Notification Model

The existing `Notification` model links to `Activity`. We'll enhance the Activity model to include more structured data:

```prisma
model Activity {
  id            String         @id @default(cuid())
  teamId        String         @map("team_id")
  userId        String         @map("user_id")
  type          String         // Activity type (see ACTIVITY_TYPES)
  title         String         // Human-readable title
  details       Json?          // Structured metadata including:
                              // - description: Extended description
                              // - actionUrl: Deep link for the notification
                              // - actionLabel: Button text (e.g., "Join Team", "View Task")
                              // - metadata: Type-specific data
  createdAt     DateTime       @default(now()) @map("created_at")
  team          Team           @relation(...)
  user          User           @relation(...)
  notifications Notification[]
}
```

### New Activity Types

```typescript
export const ACTIVITY_TYPES = {
  // Existing types...
  
  // Team Invites (Enhanced)
  INVITE_RECEIVED: 'invite_received',        // NEW: Notification to invitee
  
  // Task Assignments (Enhanced)
  TASK_ASSIGNED_TO_ME: 'task_assigned_to_me', // NEW: Personal notification
};
```

## API Routes

### GET /api/notifications
Fetches notifications for the current user with pagination.

**Query params:**
- `limit`: Number of notifications (default: 50)
- `unreadOnly`: Filter to unread only
- `type`: Filter by activity type

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "activity_id": "act_456",
      "user_id": "user_789",
      "read_at": null,
      "created_at": "2025-12-01T10:00:00Z",
      "activities": {
        "id": "act_456",
        "type": "invite_received",
        "title": "You're invited to join Team Alpha",
        "description": "John Doe invited you to join as a member",
        "action_url": "/invite/abc123",
        "action_label": "Accept Invite",
        "metadata": {
          "teamId": "team_123",
          "teamName": "Team Alpha",
          "inviterName": "John Doe",
          "role": "member",
          "inviteToken": "abc123"
        },
        "created_at": "2025-12-01T10:00:00Z"
      }
    }
  ],
  "count": 1,
  "unreadCount": 1
}
```

### PATCH /api/notifications/:id
Mark notification as read.

### POST /api/notifications/mark-all-read
Mark all notifications as read.

### GET /api/notifications/unread-count
Get count of unread notifications.

## Implementation Flow

### 1. Team Invite Flow

```
User A invites User B to Team
    ↓
Create TeamInvite record
    ↓
Send email to User B
    ↓
Look up User B in database (by email)
    ↓
If User B exists:
    Create Activity (type: invite_received)
        - title: "You're invited to join {teamName}"
        - actionUrl: "/invite/{token}"
        - actionLabel: "Accept Invite"
    ↓
    Create Notification for User B linked to Activity
    ↓
User B sees notification in Inbox
    ↓
User B clicks → Redirected to invite page → Joins team
```

### 2. Scope Radar Flow

```
Budget check triggered (manual or scheduled)
    ↓
Analyze budget vs spend
    ↓
If risk level != 'safe':
    Create Activity (type: budget_warning/budget_exceeded)
        - title: "⚠️ Budget warning for {projectName}"
        - actionUrl: "/dashboard/org/{id}/projects/{projId}"
        - actionLabel: "View Project"
    ↓
    Create Notifications for:
        - Project owner
        - Team admins
    ↓
Users see warning in Inbox with quick actions
```

### 3. Recurring Invoice Flow

```
Cron job processes recurring invoices
    ↓
For each due invoice:
    Generate new invoice
    ↓
    Create Activity (type: recurring_invoice_generated)
        - title: "Recurring invoice {number} generated"
        - actionUrl: "/dashboard/org/{id}/invoices/{invId}"
        - actionLabel: "View Invoice"
    ↓
    Create Notification for invoice creator
```

### 4. Task Assignment Flow

```
Task assigned to User B
    ↓
Create TaskActivity (TASK_ASSIGNED)
    ↓
Create Activity (type: task_assigned_to_me) for User B
    - title: "You were assigned to: {taskTitle}"
    - actionUrl: "/dashboard/org/{orgId}/projects/{projId}/teams/{teamId}/boards/{boardId}"
    - actionLabel: "View Task"
    ↓
Create Notification for User B
```

## Helper Functions

### createNotificationForUser
Creates a notification directly for a specific user (not tied to team activities).

```typescript
async function createNotificationForUser(
  userId: string,
  type: ActivityType,
  title: string,
  description?: string,
  actionUrl?: string,
  actionLabel?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; notificationId?: string }>
```

### createNotificationForTeamMembers
Creates notifications for all members of a team.

```typescript
async function createNotificationForTeamMembers(
  teamId: string,
  excludeUserId: string, // Don't notify the action performer
  type: ActivityType,
  title: string,
  description?: string,
  actionUrl?: string,
  actionLabel?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; count: number }>
```

## UI Components

### NotificationCenter (Enhanced Notion-like Inbox)

The `NotificationCenter` component (`src/components/notifications/notification-center.tsx`) provides a comprehensive notification inbox experience similar to Notion's.

#### Features:
- **Slide-out Panel**: Opens from the right side with a clean, modern design
- **Filtering by Type**: Filter notifications by category (All, Invites, Tasks, Invoices, Scope Radar)
- **View Mode Toggle**: Switch between "Unread" and "All" notifications
- **Category Badges**: Shows unread count per category in the filter dropdown
- **Actionable Items**: Direct action buttons for specific notification types
- **Smart Routing**: Clicking notifications navigates to relevant pages
- **Mark as Read**: Individual and bulk "mark all read" functionality
- **Visual States**: Color-coded notification cards based on type (success/warning/error/info)

#### Notification Categories:

| Category | Action Types | Icon |
|----------|--------------|------|
| All | All types | Inbox |
| Invites | invite_sent, invite_received, invite_accepted, invite_cancelled, member_added | MailPlus |
| Tasks | task_created, task_updated, task_assigned, task_completed, task_moved | ListTodo |
| Invoices | invoice_created, invoice_sent, invoice_paid, invoice_overdue, recurring_invoice_generated, recurring_invoice_failed | Receipt |
| Scope Radar | scope_creep_detected, budget_warning, budget_exceeded, change_order_required | Zap |

#### Actionable Notification Types:

1. **Team Invites** (`invite_received`)
   - Action Button: "Join Team"
   - Routes to: `/join?code={inviteCode}`
   - Style: Purple background for prominence

2. **Task Assignments** (`task_assigned`)
   - Action Button: "View Task"
   - Routes to: `/dashboard/teams/{teamId}/board/{boardId}`
   - Style: Purple background (actionable)

3. **Budget/Scope Alerts** (`budget_warning`, `budget_exceeded`, `scope_creep_detected`)
   - Action Button: "Review Risk"
   - Routes to: `/dashboard/projects/{projectId}?tab=scope` or `/dashboard/scope-sentinel`
   - Style: Yellow (warning) or Red (exceeded) background

4. **Invoice Notifications** (`invoice_*`, `recurring_invoice_generated`)
   - Routes to: `/dashboard/invoices/{invoiceId}`
   - No dedicated action button (click-through navigation)

5. **Proposal Notifications** (`proposal_*`)
   - Routes to: `/dashboard/proposals/{proposalId}`
   - No dedicated action button (click-through navigation)

#### Visual States:

| State | Background | Border | Use Cases |
|-------|------------|--------|-----------|
| Success | Green | Green | invoice_paid, proposal_accepted, task_completed |
| Error | Red | Red | invoice_overdue, budget_exceeded, proposal_rejected |
| Warning | Yellow | Yellow | budget_warning, scope_creep_detected |
| Info | Blue | Blue | invoice_sent, proposal_sent, recurring_invoice_generated |
| Actionable | Purple | Purple | invite_received, task_assigned |
| Default | Gray | Gray | Other types |

#### Code Structure:

```typescript
// Notification categories for filtering
type NotificationCategory = 'all' | 'invites' | 'tasks' | 'invoices' | 'scope' | 'other';

// Map action types to categories
function getNotificationCategory(actionType: string): NotificationCategory;

// Get the route for a notification based on its type and metadata
function getNotificationRoute(notification: Notification): string | null;

// Main component
export default function NotificationCenter() {
  // State for filtering and view mode
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');
  const [viewMode, setViewMode] = useState<'unread' | 'all'>('unread');
  
  // Click handler with navigation
  async function handleNotificationClick(notification: Notification);
}
```

### Notification Item Types

1. **Invite Notification**
   - Team avatar/icon
   - "Join Team" primary action button
   - Shows inviter name and role
   - Purple actionable styling

2. **Budget Alert**
   - Risk level indicator (color coded)
   - "Review Risk" action button
   - Warning/error styling based on severity

3. **Invoice Notification**
   - Amount and client displayed
   - Click-through to invoice details
   - Blue info styling

4. **Task Assignment**
   - "View Task" action button
   - Purple actionable styling
   - Shows task title and board info

## Migration Required

Run Prisma migration after schema changes:
```bash
pnpm prisma migrate dev --name enhanced_notifications
```

## Files Modified

1. `prisma/schema.prisma` - No changes needed (existing schema is sufficient)
2. `src/lib/notifications.ts` - Add new functions and types
3. `src/app/api/notifications/route.ts` - Implement notification fetching
4. `src/app/api/teams/invites/route.ts` - Add invite notifications
5. `src/app/api/ai/scope-sentinel/budget-check/route.ts` - Already has notifications
6. `src/app/api/cron/process-recurring-invoices/route.ts` - Already has notifications
7. `src/app/api/teams/[teamId]/boards/[boardId]/tasks/[taskId]/route.ts` - Add task notifications
8. `src/components/notifications/notification-center.tsx` - Enhanced UI

## Testing Checklist

- [ ] Team invite creates notification for invited user
- [ ] Clicking invite notification redirects to join page with invite code
- [ ] Budget warning creates notifications for team members
- [ ] Budget alert shows correct risk level styling (yellow/red)
- [ ] Recurring invoice creates notification on generation
- [ ] Task assignment creates notification for assignee
- [ ] Task assignment notification has "View Task" action button
- [ ] Mark as read works correctly
- [ ] Mark all as read works correctly
- [ ] Unread count updates correctly
- [ ] Action buttons work and redirect correctly
- [ ] Filter dropdown filters by notification type
- [ ] Unread/All toggle switches view correctly
- [ ] Category badges show correct unread counts
- [ ] Notification click navigates to correct page

## Future Enhancements

1. **Push Notifications** - Browser push notifications for critical alerts
2. **Email Digests** - Daily/weekly summary emails
3. **Notification Preferences** - Per-type notification settings
4. **Real-time Updates** - WebSocket/SSE for instant updates
5. **Mobile App** - Push notifications for mobile
