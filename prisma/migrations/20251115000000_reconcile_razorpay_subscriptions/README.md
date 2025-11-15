# Reconcile: Razorpay Subscriptions

This migration was generated using `prisma migrate diff` comparing the current database schema with `prisma/schema.prisma`.

Purpose: Add new enums and tables needed for Razorpay integration and subscription billing without dropping existing data.

Important:
- The SQL in `migration.sql` is additive and intended to be safe for production (it creates new types, tables, indexes, and foreign keys).
- Please review the SQL carefully and ensure it doesn't conflict with existing table names or custom schema mappings.
- If applying to Supabase / managed DB, prefer running this SQL via the Supabase SQL Editor or using `prisma migrate deploy` in a CI pipeline.

Apply steps (recommended for production):
1. Review `migration.sql` to confirm no destructive operations.
2. Create a backup or snapshot of the database (Supabase allows backups or create a DB dump).
3. Run the SQL in the backup/controls or use `prisma migrate deploy` to apply migrations.

Local dev:
- For local dev databases, you can run `pnpm prisma migrate dev` with the migration folder committed, or `pnpm prisma migrate reset` to fully re-run migrations in a disposable environment.

If you want, I can now:
- Generate a `prisma` migration folder that includes migration metadata (not only SQL) and mark it applied in migration history (if appropriate), or
- Prepare an automated CI script to run `prisma migrate deploy` in your staging environment.

Please let me know how you'd like to proceed.