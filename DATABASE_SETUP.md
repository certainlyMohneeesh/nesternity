# 🚀 Setting Up Clean PostgreSQL Database

## Option 1: Neon (Recommended - FREE PostgreSQL)

1. **Go to https://neon.tech**
2. **Sign up** with your GitHub account
3. **Create a new project** called "nesternity-clean"
4. **Copy the connection string** and update your .env.local

## Option 2: Railway (Alternative)

1. **Go to https://railway.app**
2. **Sign up** with GitHub
3. **Create PostgreSQL database**
4. **Copy connection string**

## Option 3: Local PostgreSQL (If you prefer)

```bash
# Install PostgreSQL locally
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb nesternity_clean
```

## Update .env.local

Replace the DATABASE_URL in your .env.local with your real connection string:

```bash
# Example Neon connection string:
DATABASE_URL="postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/nesternity_clean?sslmode=require"
```

## Next Steps

After setting up your database:

1. Run `npx prisma migrate dev --name init`
2. Run `npx prisma generate`
3. Start building clean API routes!

🎯 **This will give you a clean, simple PostgreSQL database without any Supabase complexity!**
