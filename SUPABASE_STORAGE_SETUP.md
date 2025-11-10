# Supabase Storage Buckets Setup Guide

This guide will help you create the necessary storage buckets for invoices and proposals in Supabase.

## 📋 Prerequisites

- Supabase project created and running
- Access to Supabase Dashboard
- Project URL and keys already configured in your `.env` file

---

## 🗂️ Step 1: Access Supabase Storage

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **scmyzihaokadwwszaimd** (or your project name)
3. Click on **Storage** in the left sidebar (🗄️ icon)

---

## 📦 Step 2: Create Invoices Bucket

1. Click the **"New bucket"** button (top right)
2. Fill in the bucket details:
   ```
   Name: invoices
   Public bucket: ✓ (checked)
   File size limit: 10 MB (10485760 bytes)
   Allowed MIME types: application/pdf, text/html
   ```
3. Click **"Create bucket"**

### Configure Invoices Bucket Policies

After creating the bucket, you need to set up RLS (Row Level Security) policies:

1. Click on the **invoices** bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Public Read Access
```
Policy name: Public Read Access
Allowed operation: SELECT
Target roles: public
Using expression: true
With check expression: (leave empty)
```

#### Policy 2: Authenticated Upload
```
Policy name: Authenticated Users Can Upload
Allowed operation: INSERT
Target roles: authenticated
Using expression: (leave empty)
With check expression: true
```

#### Policy 3: Authenticated Update
```
Policy name: Authenticated Users Can Update
Allowed operation: UPDATE
Target roles: authenticated
Using expression: true
With check expression: true
```

4. Click **"Save policy"** for each policy

---

## 📄 Step 3: Create Proposals Bucket

1. Click the **"New bucket"** button again
2. Fill in the bucket details:
   ```
   Name: proposals
   Public bucket: ✓ (checked)
   File size limit: 10 MB (10485760 bytes)
   Allowed MIME types: application/pdf
   ```
3. Click **"Create bucket"**

### Configure Proposals Bucket Policies

Same as invoices, set up RLS policies:

1. Click on the **proposals** bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Public Read Access
```
Policy name: Public Read Access
Allowed operation: SELECT
Target roles: public
Using expression: true
With check expression: (leave empty)
```

#### Policy 2: Authenticated Upload
```
Policy name: Authenticated Users Can Upload
Allowed operation: INSERT
Target roles: authenticated
Using expression: (leave empty)
With check expression: true
```

#### Policy 3: Authenticated Update
```
Policy name: Authenticated Users Can Update
Allowed operation: UPDATE
Target roles: authenticated
Using expression: true
With check expression: true
```

4. Click **"Save policy"** for each policy

---

## 🔐 Alternative: SQL Setup (Quick Method)

If you prefer using SQL, you can run these commands in the **SQL Editor**:

### Go to SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Paste the following SQL:

```sql
-- Create invoices bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  true,
  10485760,
  ARRAY['application/pdf', 'text/html']
);

-- Create proposals bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposals',
  'proposals',
  true,
  10485760,
  ARRAY['application/pdf']
);

-- Create policies for invoices bucket
CREATE POLICY "Public Read Access for Invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

CREATE POLICY "Authenticated Upload for Invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Authenticated Update for Invoices"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices')
WITH CHECK (bucket_id = 'invoices');

-- Create policies for proposals bucket
CREATE POLICY "Public Read Access for Proposals"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'proposals');

CREATE POLICY "Authenticated Upload for Proposals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proposals');

CREATE POLICY "Authenticated Update for Proposals"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'proposals')
WITH CHECK (bucket_id = 'proposals');
```

4. Click **"Run"** to execute the SQL

---

## ✅ Step 4: Verify Buckets

1. Go back to **Storage** in the left sidebar
2. You should see two buckets:
   - ✅ **invoices** (Public)
   - ✅ **proposals** (Public)

3. Click on each bucket to verify:
   - The bucket is marked as **Public**
   - File size limit is **10 MB**
   - Policies are active (you should see 3 policies per bucket)

---

## 🧪 Step 5: Test Upload

After setting up the buckets, test the upload by:

1. Go to your app: `http://localhost:3000/dashboard/proposals`
2. Open an existing proposal
3. Click **"Send"** to trigger PDF generation and upload
4. Check the Supabase Storage dashboard to see the uploaded file

### Expected Structure:
```
invoices/
├── pdfs/
│   └── invoice-INV-XXX.pdf
└── html/
    └── invoice-INV-XXX.html

proposals/
└── pdfs/
    └── proposal-xxxxx.pdf
```

---

## 🔍 Troubleshooting

### Issue: "Bucket not found"
**Solution:** Make sure you ran the SQL or created the buckets through the UI.

### Issue: "New row violates row-level security policy"
**Solution:** Check that all 3 policies (SELECT, INSERT, UPDATE) are created and active.

### Issue: "Access denied"
**Solution:** Verify that:
- The bucket is marked as **Public**
- The RLS policies allow public reads
- Your Supabase keys in `.env` are correct

### Issue: Files upload but can't access them
**Solution:** Make sure the bucket is set to **Public** and the SELECT policy allows `public` role.

---

## 📝 Bucket Configuration Summary

| Bucket | Public | Size Limit | MIME Types | Policies |
|--------|--------|------------|------------|----------|
| invoices | ✓ Yes | 10 MB | PDF, HTML | 3 (SELECT, INSERT, UPDATE) |
| proposals | ✓ Yes | 10 MB | PDF | 3 (SELECT, INSERT, UPDATE) |

---

## 🎉 You're Done!

Once both buckets are created with the correct policies, your application will be able to:
- ✅ Upload invoice PDFs to the `invoices` bucket
- ✅ Upload proposal PDFs to the `proposals` bucket
- ✅ Generate public URLs for both
- ✅ Download PDFs from the browser

If you encounter any issues, check the Supabase logs in the Dashboard under **Logs** → **Storage**.
