# Notification System Testing Guide

## Quick Test Scenarios

### 1. Test Scope Sentinel Notifications

**Trigger**: Run budget check analysis on a project

```bash
# Via API
POST /api/ai/scope-sentinel/budget-check
{
  "projectId": "your-project-id",
  "clientId": "your-client-id"
}
```

**Expected Notification**:
- Type: Budget Warning / Budget Exceeded / Scope Creep Detected
- Icon: AlertCircle / AlertOctagon / TrendingUp
- Color: Yellow / Red / Orange
- Details: Budget amounts, currency, percentage

**Verify**:
- [ ] Notification appears in Notification Center
- [ ] Correct icon displays
- [ ] Currency formatted correctly (₹ for INR)
- [ ] Timestamp shows "time ago" format
- [ ] Badge color matches severity

---

### 2. Test Recurring Invoice Notifications

**Trigger**: Wait for cron job to run or manually trigger

```bash
# Run email worker (processes recurring invoices)
node scripts/email-worker.js
```

**Expected Notifications**:
- ✅ Success: "Recurring invoice INV-XXX auto-generated"
- ❌ Failure: "Failed to generate recurring invoice"

**Verify**:
- [ ] Success notification has green badge
- [ ] Failure notification has red badge
- [ ] Invoice number is correct
- [ ] Client name is shown
- [ ] Amount and currency are correct

---

### 3. Test Proposal Signature Notifications

**Trigger**: Client signs a proposal

```bash
# Via proposal public page
POST /api/proposals/[id]/sign
{
  "signerName": "John Doe",
  "signerEmail": "john@client.com",
  "signatureBlob": "data:image/png;base64,...",
  "token": "access-token"
}
```

**Expected Notification**:
- Type: Proposal Signed
- Icon: FileSignature
- Color: Green
- Message: "✍️ Client Name signed the proposal"

**Verify**:
- [ ] Notification appears immediately
- [ ] Celebration emoji shows (🎉)
- [ ] Signer name is displayed
- [ ] Proposal title is correct
- [ ] Amount and currency shown

---

### 4. Test Proposal Accept Notification

**Trigger**: User manually accepts proposal

```bash
# Via dashboard
POST /api/proposals/[id]/accept
```

**Expected Notification**:
- Type: Proposal Accepted
- Icon: CheckCircle2
- Color: Green
- Message: "🎉 Client Name accepted your proposal!"

**Verify**:
- [ ] Green badge displays
- [ ] Correct client name
- [ ] Amount formatted with currency
- [ ] Timestamp updates

---

### 5. Test Team Invite Notifications

**Trigger**: Send team invite

```bash
# Via team settings
POST /api/teams/invites
{
  "teamId": "team-id",
  "email": "newmember@example.com",
  "role": "member"
}
```

**Expected Notifications**:
- Sent: "Team invite sent"
- Accepted: "User joined Team Name"
- Cancelled: "Invite cancelled"

**Verify**:
- [ ] Invite sent notification appears
- [ ] Email is shown
- [ ] Team name is correct
- [ ] Icon is UserPlus for sent invites

---

## UI Testing Checklist

### Desktop (1920x1080)
- [ ] Notification sheet opens from top right
- [ ] Width is 400px (w-[400px])
- [ ] Scroll works when >10 notifications
- [ ] Icons are 20x20 (h-5 w-5)
- [ ] "Mark all read" button appears when unread > 0
- [ ] Empty state shows when no notifications
- [ ] Unread badge shows on bell icon

### Tablet (768x1024)
- [ ] Sheet takes 80% width
- [ ] Touch targets are >44px
- [ ] Scroll works smoothly
- [ ] Icons remain visible
- [ ] Text doesn't overflow

### Mobile (375x667)
- [ ] Sheet is full width
- [ ] Close button is easily tappable
- [ ] Notification cards stack properly
- [ ] Icons scale appropriately
- [ ] Badge fits on bell icon

---

## Functional Testing

### Notification Creation
```typescript
// Test in browser console or via API
fetch('/api/activities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teamId: 'your-team-id',
    actionType: 'INVOICE_PAID',
    title: 'Test Invoice Paid',
    description: '₹5,000 received from Test Client',
    metadata: {
      invoiceId: 'test-123',
      clientName: 'Test Client',
      amount: 5000,
      currency: 'INR'
    }
  })
});
```

### Verify Notification Appears
1. Open Notification Center
2. Check for new notification
3. Verify icon, color, and text
4. Check timestamp
5. Try marking as read (when implemented)

---

## Integration Testing

### Scope Sentinel Flow
1. Create project with budget
2. Add tasks with time estimates
3. Log time that exceeds budget
4. Run budget check
5. **Verify**: Notification appears with warning

### Invoice Flow
1. Create recurring invoice setup
2. Wait for cron to run
3. **Verify**: Success notification
4. Simulate failure (invalid data)
5. **Verify**: Failure notification

### Proposal Flow
1. Create and send proposal
2. Client opens proposal link
3. Client signs proposal
4. **Verify**: Signature notification to owner
5. Owner sees celebration message

### Team Flow
1. Owner sends invite
2. **Verify**: "Invite sent" notification
3. Recipient accepts
4. **Verify**: "User joined" notification
5. Owner cancels pending invite
6. **Verify**: "Invite cancelled" notification

---

## Performance Testing

### Load Test
```bash
# Create 100 notifications rapidly
for i in {1..100}; do
  curl -X POST /api/activities \
    -H "Content-Type: application/json" \
    -d "{\"teamId\":\"...\", \"actionType\":\"TEST\", \"title\":\"Test $i\"}"
done
```

**Verify**:
- [ ] Notification center loads within 1 second
- [ ] Scroll is smooth
- [ ] No memory leaks
- [ ] UI doesn't freeze

---

## Accessibility Testing

### Screen Reader
- [ ] Notification count announced
- [ ] Notification types read correctly
- [ ] Timestamps are meaningful
- [ ] Action buttons labeled

### Keyboard Navigation
- [ ] Tab to notification bell
- [ ] Enter/Space opens sheet
- [ ] Tab through notifications
- [ ] Escape closes sheet
- [ ] Arrow keys navigate notifications

### Color Contrast
- [ ] All text passes WCAG AA (4.5:1)
- [ ] Badge colors distinguishable
- [ ] Icons visible in high contrast mode

---

## Error Handling

### Network Failures
- [ ] Graceful fallback when API fails
- [ ] Retry logic for transient errors
- [ ] Error message shown to user
- [ ] Empty state for failed loads

### Invalid Data
- [ ] Missing teamId handled
- [ ] Invalid activity type ignored
- [ ] Malformed JSON caught
- [ ] Database errors logged

---

## Browser Testing

### Chrome (Latest)
- [ ] All features work
- [ ] Icons render correctly
- [ ] Animations smooth

### Firefox (Latest)
- [ ] All features work
- [ ] Icons render correctly
- [ ] Animations smooth

### Safari (Latest)
- [ ] All features work
- [ ] Icons render correctly
- [ ] Animations smooth (iOS)

### Edge (Latest)
- [ ] All features work
- [ ] Icons render correctly
- [ ] Animations smooth

---

## Production Readiness

### Before Deploying
- [ ] All TypeScript errors resolved
- [ ] No console errors in production build
- [ ] Environment variables configured
- [ ] Database indexes added
- [ ] API rate limits configured
- [ ] Error logging enabled
- [ ] Performance monitoring setup

### Monitoring
- [ ] Track notification creation rate
- [ ] Monitor API response times
- [ ] Alert on error rate >1%
- [ ] Dashboard for notification metrics

---

## Quick Verification Commands

```bash
# Check if notifications API works
curl http://localhost:3000/api/notifications

# Check unread count
curl http://localhost:3000/api/notifications/unread-count

# Create test activity
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -d '{"teamId":"...","actionType":"TEST","title":"Test Notification"}'
```

---

## Expected Console Logs

When notifications work correctly:

```
[Notifications] Fetching notifications via API
[NotificationsAPI] GET - Fetching notifications
[NotificationsAPI] Authenticated user: user_123
[NotificationsAPI] Found activities: 15
[Notifications] Received notifications: 15
```

When creating notification:

```
[ActivitiesAPI] POST - Creating activity
[ActivitiesAPI] Activity created: activity_456
✅ Notification created successfully
```

---

## Troubleshooting

### Notifications not appearing?
1. Check browser console for errors
2. Verify user is authenticated
3. Check team membership
4. Ensure teamId is correct
5. Verify API endpoint returns data

### Wrong icons showing?
1. Check lucide-react is installed
2. Verify icon names match exactly
3. Clear browser cache
4. Check icon import statements

### Colors not working?
1. Verify Tailwind CSS is loaded
2. Check class names are correct
3. Ensure color classes exist in tailwind.config

### Timestamps wrong?
1. Check system timezone
2. Verify Date parsing
3. Test with different dates
4. Ensure formatTimeAgo logic is correct

---

## Success Criteria

✅ **All notifications display correctly**
✅ **Icons match notification types**
✅ **Colors indicate severity**
✅ **Responsive on all devices**
✅ **No TypeScript errors**
✅ **Performance <1s load time**
✅ **Accessible (WCAG AA)**
✅ **No console errors**

🎉 **Ready for Production!**
