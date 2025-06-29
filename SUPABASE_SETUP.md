# 🚀 Nesternity CRM - Supabase Database Setup Guide

## Prerequisites
- A Supabase account and project
- Your Supabase project URL and anon key

## Step 1: Set up your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your project to be ready (this takes a few minutes)
3. Copy your project URL and anon key from the project settings

## Step 2: Configure Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Run Database Setup Scripts

Go to your Supabase dashboard → SQL Editor and run these scripts **in order**:

### 1. Create Tables and Indexes
Copy and paste the entire content of `sql/01_create_tables.sql` and run it.

### 2. Set up Row Level Security Policies  
Copy and paste the entire content of `sql/02_rls_policies.sql` and run it.

### 3. Create Functions and Triggers
Copy and paste the entire content of `sql/03_functions_triggers.sql` and run it.

## Step 4: Enable Authentication

1. In your Supabase dashboard, go to **Authentication → Settings**
2. Enable **Email confirmations** if you want email verification
3. Set your site URL to `http://localhost:3000` (for development)

## Step 5: Test the Setup

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Go to `http://localhost:3000`
4. Try registering a new account and creating a team

## 🎯 What Gets Created

### Core Tables
- `users` - User profiles with display names
- `teams` - Team information
- `team_users` - Team membership and roles
- `clients` - Client management
- `boards` - Kanban boards
- `board_columns` - Board columns
- `tasks` - Tasks with assignments and priorities

### Advanced Features
- `team_invites` - Email-based team invitations
- `activities` - Activity tracking for notifications
- `notifications` - User-specific notifications

### Security Features
- **Row Level Security (RLS)** on all tables
- **Comprehensive policies** for team-based access control
- **Secure functions** for invite acceptance and activity creation

### Automatic Features
- **Auto-add team creators** as admins
- **Timestamp triggers** for updated_at fields
- **Activity notifications** for team members

## 🔧 Troubleshooting

### Common Issues:

1. **"relation does not exist" errors**
   - Make sure you ran the SQL scripts in the correct order
   - Check that all tables were created successfully

2. **Permission denied errors**
   - Verify RLS policies are set up correctly
   - Check that your user is properly authenticated

3. **Function errors**
   - Ensure all functions were created without syntax errors
   - Check the Supabase logs for detailed error messages

### Testing Queries

You can test if everything is set up correctly by running these queries in the SQL editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'teams', 'team_users', 'activities', 'notifications');

-- Check if functions exist  
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('accept_team_invite', 'create_activity_with_notifications');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

## 🎉 You're Ready!

Once all scripts run successfully, your Nesternity CRM database is fully configured with:

✅ Complete team management system  
✅ Kanban boards with drag-and-drop  
✅ Email-based invite system  
✅ Real-time notifications  
✅ Comprehensive security policies  

Start building your CRM! 🚀
