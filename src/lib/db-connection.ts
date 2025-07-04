import { db } from './db'

// Connection pool management for production
export async function ensureDbConnection() {
  try {
    // Test the connection
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    
    // Try to reconnect
    try {
      await db.$connect()
      return true
    } catch (reconnectError) {
      console.error('Database reconnection failed:', reconnectError)
      return false
    }
  }
}

// Use this in your API routes
export async function withDbConnection<T>(
  operation: () => Promise<T>
): Promise<T> {
  const isConnected = await ensureDbConnection()
  
  if (!isConnected) {
    throw new Error('Database connection unavailable')
  }
  
  return operation()
}