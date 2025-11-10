/**
 * AI Response Caching
 * Simple in-memory cache with TTL for AI completions
 * TODO: Replace with Redis for production
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class AICache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate cache key from input
   */
  private generateKey(prefix: string, input: Record<string, unknown>): string {
    const sortedInput = JSON.stringify(input, Object.keys(input).sort());
    return `${prefix}:${Buffer.from(sortedInput).toString('base64').slice(0, 32)}`;
  }

  /**
   * Get cached value
   */
  get<T>(prefix: string, input: Record<string, unknown>): T | null {
    const key = this.generateKey(prefix, input);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT for ${prefix}`);
    return entry.data;
  }

  /**
   * Set cached value
   */
  set<T>(
    prefix: string, 
    input: Record<string, unknown>, 
    data: T, 
    ttl?: number
  ): void {
    const key = this.generateKey(prefix, input);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(key, { data, expiresAt });
    console.log(`💾 Cached ${prefix} (TTL: ${ttl || this.defaultTTL}ms)`);
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }

    return cleared;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (entry.expiresAt < now) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      expired,
    };
  }
}

// Singleton instance
export const aiCache = new AICache();

// Auto-cleanup expired entries every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    aiCache.clearExpired();
  }, 60 * 60 * 1000);
}

/**
 * Helper to wrap AI calls with caching
 */
export async function withCache<T>(
  cacheKey: string,
  input: Record<string, unknown>,
  generator: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = aiCache.get<T>(cacheKey, input);
  if (cached !== null) {
    return cached;
  }

  // Generate fresh result
  console.log(`🔄 Cache MISS for ${cacheKey}, generating...`);
  const result = await generator();

  // Store in cache
  aiCache.set(cacheKey, input, result, ttl);

  return result;
}
