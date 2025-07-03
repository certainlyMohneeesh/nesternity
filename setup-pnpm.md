# Install dependencies with pnpm
pnpm install

# Generate Prisma client
pnpm exec prisma generate

# If needed, push schema changes to database
pnpm exec prisma db push