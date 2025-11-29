# Password Reset Email Configuration Guide

## Overview
This guide explains how to configure Supabase email templates for password reset and invite flows to work properly with your Next.js application.

---

## 🔑 Understanding the Flow

### Password Reset Flow:
```
1. User requests password reset
   ↓
2. API calls supabase.auth.resetPasswordForEmail()
   ↓
3. Supabase sends email with magic link
   ↓
4. User clicks link in email
   ↓
5. Supabase validates token and redirects to /auth/callback
   ↓
6. Callback extracts tokens from URL hash
   ↓
7. Callback redirects to /auth/reset-password with tokens
   ↓
8. Reset password page sets session and allows password change
   ↓
9. User updates password successfully ✅
```

---

## 📧 Supabase Email Template Configuration

### **Step 1: Access Email Templates**

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. You'll see templates for:
   - Confirm signup
   - **Magic Link** (for passwordless login)
   - **Change Email Address**
   - **Reset Password** ⭐ (this is what we need)

### **Step 2: Configure Password Reset Template**

Select the **"Reset Password"** template and update it with:

#### **Subject:**
```
Reset Your Nesternity Password
```

#### **Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Nesternity</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
    
    <p style="color: #4b5563; font-size: 16px;">
      We received a request to reset your password. Click the button below to choose a new password:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 14px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
    </p>
    
    <p style="color: #6b7280; font-size: 14px;">
      This link will expire in 24 hours for security reasons.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="color: #6b7280; font-size: 12px; word-break: break-all; margin: 5px 0 0 0;">
      {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery
    </p>
  </div>
</body>
</html>
```

#### **Important Template Variables:**
- `{{ .SiteURL }}` - Your application URL (configured in Supabase)
- `{{ .TokenHash }}` - The secure password reset token
- `{{ .Email }}` - User's email address (optional to use)

### **Step 3: Configure Invite Email Template (for Team Invites)**

Select the **"Invite User"** template:

#### **Subject:**
```
You've been invited to join {{ .TeamName }} on Nesternity
```

#### **Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Nesternity</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Team Invitation</h2>
    
    <p style="color: #4b5563; font-size: 16px;">
      You've been invited to join a team on Nesternity. Click the button below to accept the invitation and set up your account:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 14px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                display: inline-block;">
        Accept Invitation
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
    
    <p style="color: #6b7280; font-size: 14px;">
      This invitation link will expire in 7 days.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="color: #6b7280; font-size: 12px; word-break: break-all; margin: 5px 0 0 0;">
      {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite
    </p>
  </div>
</body>
</html>
```

### **Step 4: Configure Signup Confirmation Template**

Select the **"Confirm signup"** template:

#### **Email Body Key Part:**
```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup" 
   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 14px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          display: inline-block;">
  Confirm Email Address
</a>
```

---

## ⚙️ URL Configuration in Supabase

### **Step 1: Set Site URL**

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** based on environment:

**Development:**
```
http://localhost:3000
```

**Production:**
```
https://nesternity.cyth.app
```

### **Step 2: Add Redirect URLs**

Add these to the **Redirect URLs** allowlist:

**Development:**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
http://localhost:3000/dashboard
http://localhost:3000/invite/callback
```

**Production:**
```
https://nesternity.cyth.app/auth/callback
https://nesternity.cyth.app/auth/reset-password
https://nesternity.cyth.app/dashboard
https://nesternity.cyth.app/invite/callback
https://scmyzihaokadwwszaimd.supabase.co/auth/v1/callback
```

---

## 🔐 Critical URL Format

All email templates MUST use this URL format:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=<TYPE>
```

### **Why `/auth/callback` first?**

1. **Security**: Supabase validates the token and sets up the session
2. **Token Extraction**: The callback page extracts `access_token` and `refresh_token` from the URL hash
3. **Type Routing**: Based on the `type` parameter, it routes to the appropriate page:
   - `type=recovery` → redirects to `/auth/reset-password`
   - `type=signup` → syncs user and redirects to `/dashboard`
   - `type=invite` → redirects to `/invite/callback`

### **What Happens:**

```
Email Link:
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery

↓ User clicks ↓

Supabase processes token and redirects:
/auth/callback#access_token=xxx&refresh_token=yyy&type=recovery

↓ Callback page extracts tokens ↓

Redirects with tokens in hash:
/auth/reset-password#access_token=xxx&refresh_token=yyy&type=recovery

↓ Reset page reads hash ↓

Session established, user can reset password ✅
```

---

## 🧪 Testing Your Configuration

### **Test Password Reset:**

1. Go to `/auth/forgot-password`
2. Enter your email
3. Click "Send reset email"
4. Check your email inbox
5. Click the reset link
6. Should land on reset password page (not error page)
7. Enter new password
8. Should successfully update and redirect to dashboard

### **Test Signup Confirmation:**

1. Register a new user
2. Check email for confirmation link
3. Click confirmation link
4. Should land on dashboard signed in

### **Test Team Invite:**

1. Invite a user to your team
2. Check their email for invite link
3. Click invite link
4. Should create account and join team

---

## 🐛 Troubleshooting

### **Problem: "Invalid or expired reset link"**

**Causes:**
1. Email template doesn't use `token_hash` parameter
2. Site URL in Supabase doesn't match your app URL
3. Redirect URL not in allowlist
4. Token already used or expired (24 hour limit)

**Fix:**
1. Update email template with correct URL format
2. Verify Site URL matches exactly
3. Add `/auth/callback` to redirect URLs
4. Request a new password reset

### **Problem: Email link goes to Supabase URL**

**Cause:** Email template uses wrong redirect format

**Fix:** Update template to use:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery
```

### **Problem: User lands on page but session not found**

**Cause:** Tokens not being extracted from hash

**Fix:** Check browser console for logs, ensure callback page is reading hash fragment

---

## 📝 Code Summary

### **Files Involved:**

1. **`/app/api/auth/forgot-password/route.ts`**
   - Calls `supabase.auth.resetPasswordForEmail()`
   - Redirects to `/auth/callback` (not `/auth/reset-password` directly)

2. **`/app/auth/callback/page.tsx`**
   - Handles all auth callbacks
   - Extracts tokens from URL hash
   - Routes based on `type` parameter:
     - `recovery` → `/auth/reset-password` with tokens
     - `signup` → `/dashboard`
     - `invite` → `/invite/callback`

3. **`/app/auth/reset-password/page.tsx`**
   - Reads tokens from hash fragment
   - Establishes session
   - Allows password update

4. **`/app/api/auth/reset-password/route.ts`**
   - Validates password requirements
   - Updates password via Supabase
   - Returns success/error

---

## ✅ Checklist

### **Supabase Dashboard Configuration:**

- [ ] Updated "Reset Password" email template with correct URL format
- [ ] Updated "Invite User" email template with correct URL format
- [ ] Updated "Confirm signup" email template with correct URL format
- [ ] Set Site URL to match your app URL
- [ ] Added `/auth/callback` to Redirect URLs allowlist
- [ ] Added `/auth/reset-password` to Redirect URLs allowlist
- [ ] Added `/dashboard` to Redirect URLs allowlist

### **Code Configuration:**

- [ ] `/api/auth/forgot-password/route.ts` redirects to `/auth/callback`
- [ ] `/auth/callback/page.tsx` handles `type=recovery`
- [ ] `/auth/reset-password/page.tsx` reads tokens from hash
- [ ] Browser console logs show successful token extraction

### **Testing:**

- [ ] Password reset email arrives with correct link
- [ ] Reset link opens callback page
- [ ] Callback redirects to reset password page
- [ ] Reset password page shows form (not error)
- [ ] Password can be updated successfully
- [ ] User redirects to dashboard after reset

---

## 🎯 Summary

**Key Points:**

1. **All auth emails must redirect to `/auth/callback` first**
2. **Use `token_hash` parameter in email templates**
3. **Include `type` parameter for proper routing**
4. **Tokens are in URL hash fragment, not query params**
5. **Session must be established before password reset**

**The Magic URL Format:**
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery
```

This format works for:
- ✅ Password reset (`type=recovery`)
- ✅ Email confirmation (`type=signup`)
- ✅ Team invites (`type=invite`)
- ✅ Magic links (passwordless login)

---

## 📚 References

- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Password Reset](https://supabase.com/docs/guides/auth/passwords)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth/redirect-urls)
