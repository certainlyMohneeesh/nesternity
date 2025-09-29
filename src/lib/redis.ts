import Redis from 'ioredis';

// Redis connection with connection pooling
class RedisConnection {
  private static instance: Redis | null = null;
  
  static getInstance(): Redis {
    if (!RedisConnection.instance) {
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379';
      
      RedisConnection.instance = new Redis(redisUrl, {
        // BullMQ requires maxRetriesPerRequest to be null
        maxRetriesPerRequest: null,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        // Connection pool
        family: 4,
        // Reconnect strategy
        reconnectOnError: (err) => {
          const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
          return targetErrors.some(targetError => err.message.includes(targetError));
        }
      });

      RedisConnection.instance.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
      });

      RedisConnection.instance.on('connect', () => {
        console.log('✅ Connected to Redis');
      });
    }
    
    return RedisConnection.instance;
  }
  
  static async disconnect() {
    if (RedisConnection.instance) {
      await RedisConnection.instance.quit();
      RedisConnection.instance = null;
    }
  }
}

export const redis = RedisConnection.getInstance();