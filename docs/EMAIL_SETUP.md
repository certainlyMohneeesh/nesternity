# Email Invite System Setup Guide

Your Nesternity CRM has **both** email invite systems fully implemented! Here's how to use them:

## 🎯 Current Status

**You have TWO working email systems:**
1. **Supabase Auth** (FREE) - Set as default
2. **Resend** (Professional) - Ready to use

## 🚀 Quick Switch

Edit `/src/lib/email-config.ts` and change this line:

```typescript
export const EMAIL_PROVIDER: EmailProvider = 'supabase-auth'; // Change this!
```

**Options:**
- `'supabase-auth'` - FREE, built-in Supabase emails
- `'resend'` - Professional service with better deliverability  
- `'hybrid'` - Try Supabase first, fallback to Resend

## 📧 Setup Instructions

### Option 1: Supabase Auth (FREE - Current Default)

1. **Get your service key:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "service_role" key (NOT the anon key)

2. **Add to your environment:**
   ```bash
   # In your .env.local file
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **That's it!** - No additional costs or setup needed

### Option 2: Resend (Professional)

1. **Sign up at resend.com**
2. **Get your API key**
3. **Add to environment:**
   ```bash
   # In your .env.local file
   RESEND_API_KEY=re_123abc456def789
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
4. **Change email provider:**
   ```typescript
   // In /src/lib/email-config.ts
   export const EMAIL_PROVIDER: EmailProvider = 'resend';
   ```

## 🧪 Testing

1. **Visit `/email-test`** to see current configuration
2. **Test invite flow:**
   - Go to Teams → Invite Members
   - Send yourself a test invite
   - Check email delivery

## 📊 Comparison

| Feature | Supabase Auth | Resend |
|---------|---------------|---------|
| **Cost** | 🟢 FREE | 🟡 100/day free, then $20/mo |
| **Setup** | 🟢 1 env var | 🟡 2 env vars + signup |
| **Deliverability** | 🟡 Good | 🟢 Excellent |
| **Customization** | 🔴 Limited | 🟢 Full control |
| **Maintenance** | 🟢 Zero | 🟡 Minimal |

## 🔧 Environment Variables Summary

```bash
# Required for both
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For Supabase Auth emails (FREE)
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# For Resend emails (PAID)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## 💡 Recommendations

**For Solopreneurs/MVPs:**
- Start with **Supabase Auth** (FREE)
- Switch to **Resend** when you need better deliverability

**For Production/Scale:**
- Use **Resend** for reliability and features
- Keep **Supabase Auth** as backup with `'hybrid'` mode

Your system will automatically handle the switching - no code changes needed! 🎉
