# 🎯 **NESTERNITY CRM - SUPABASE SETUP INSTRUCTIONS**

## 📋 **Quick Setup Checklist**

### ✅ **Step 1: Database Setup (REQUIRED)**
Go to your Supabase Dashboard → SQL Editor and run these scripts **in exact order**:

1. **Copy/paste and run:** `sql/01_create_tables.sql`
2. **Copy/paste and run:** `sql/02_rls_policies.sql` 
3. **Copy/paste and run:** `sql/03_functions_triggers.sql`

### ✅ **Step 2: Verify Setup**
Run `sql/verify_setup.sql` to confirm everything is working.

### ✅ **Step 3: Environment Variables**
Your `.env.local` should have:
```env
NEXT_PUBLIC_SUPABASE_URL="https://wempqndcysnfdkqubpss.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### ✅ **Step 4: Start Development**
```bash
npm install
npm run dev
```

---

## 🗄️ **What Gets Created in Your Database**

### **Core Tables:**
- `users` - User profiles with display names
- `teams` - Team management  
- `team_users` - Team membership & roles
- `clients` - Client management
- `boards` - Kanban boards
- `board_columns` - Board columns
- `tasks` - Tasks with assignments

### **Advanced Features:**
- `team_invites` - Email-based invitations
- `activities` - Activity tracking
- `notifications` - Real-time notifications

### **Security & Functions:**
- **Row Level Security (RLS)** on all tables
- **Secure functions** for invites and activities
- **Automatic triggers** for team admin creation

---

## 🚀 **Features You Get**

✅ **Complete Team Management**
- Create teams, invite members
- Transfer ownership, manage roles
- Email invites for unregistered users

✅ **Advanced Kanban Boards**
- Drag-and-drop task management
- Task assignment to team members
- Priority levels and due dates

✅ **Real-time Notifications**
- Activity feed for all team actions
- Notification center with unread counts
- Automatic team member notifications

✅ **Secure Multi-tenant Architecture**
- Team-based data isolation
- Role-based permissions
- Comprehensive security policies

---

## 🔧 **Troubleshooting**

**❌ "relation does not exist" errors**
→ Run the SQL scripts in the exact order listed above

**❌ Permission denied errors** 
→ Make sure RLS policies were created successfully

**❌ Function not found errors**
→ Ensure `03_functions_triggers.sql` ran without errors

**✅ Test your setup**
→ Run `sql/verify_setup.sql` in Supabase SQL Editor

---

## 📞 **Support**

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify your environment variables are correct
3. Ensure all SQL scripts ran successfully
4. Run the verification script to identify missing components

Your Nesternity CRM is now ready for production! 🎉
