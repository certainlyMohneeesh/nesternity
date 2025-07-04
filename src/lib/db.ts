import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Configure for production deployment
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

export const prisma = db // Export for compatibility

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Test database connection
export async function testDatabaseConnection() {
  try {
    await db.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect()
})
