import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

export const prisma = db // Export for compatibility

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Add connection testing
export async function testDatabaseConnection() {
  try {
    await db.$connect()
    console.log('✅ Database connected successfully')
    await db.$queryRaw`SELECT 1`
    console.log('✅ Database query test successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}
