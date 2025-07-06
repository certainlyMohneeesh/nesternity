/**
 * 🚀 Performance Optimization Infrastructure
 * Industry-standard performance utilities for blazing fast app
 */

import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { Redis } from 'ioredis';

// ==================== PAGINATION UTILITIES ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

export function parsePaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);
  
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1')),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20'))),
    cursor: searchParams.get('cursor') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const { page = 1, limit = 20 } = params;
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextCursor: data.length === limit ? data[data.length - 1]?.id : undefined,
      prevCursor: page > 1 ? data[0]?.id : undefined,
    },
  };
}

// ==================== CACHING UTILITIES ====================

export const CACHE_TAGS = {
  USERS: 'users',
  TEAMS: 'teams',
  PROJECTS: 'projects',
  CLIENTS: 'clients',
  INVOICES: 'invoices',
  TASKS: 'tasks',
  ISSUES: 'issues',
  BOARDS: 'boards',
  DASHBOARD: 'dashboard',
} as const;

export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  EXTENDED: 3600, // 1 hour
  DAILY: 86400, // 24 hours
} as const;

// Redis client for advanced caching (optional)
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });
}

export function createCacheKey(
  prefix: string,
  userId: string,
  params: Record<string, any> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${userId}${sortedParams ? `:${sortedParams}` : ''}`;
}

export async function getCachedData<T>(
  key: string,
  fallback: () => Promise<T>,
  duration: number = CACHE_DURATIONS.MEDIUM
): Promise<T> {
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache read error:', error);
    }
  }

  const data = await fallback();

  if (redis && data) {
    try {
      await redis.setex(key, duration, JSON.stringify(data));
    } catch (error) {
      console.warn('Redis cache write error:', error);
    }
  }

  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (redis) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn('Redis cache invalidation error:', error);
    }
  }
}

// Next.js cache wrapper
export function cachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  tags: string[] = [],
  revalidate: number = CACHE_DURATIONS.MEDIUM
) {
  return unstable_cache(
    fn,
    undefined,
    {
      tags,
      revalidate,
    }
  );
}

// ==================== QUERY OPTIMIZATION ====================

export interface OptimizedQueryOptions {
  select?: Record<string, any>;
  include?: Record<string, any>;
  orderBy?: Record<string, any>;
  where?: Record<string, any>;
  skip?: number;
  take?: number;
}

export function optimizeInclude(fields: string[]): Record<string, any> {
  return fields.reduce((acc, field) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!acc[parent]) acc[parent] = {};
      if (child === '*') {
        acc[parent] = true;
      } else {
        if (!acc[parent].select) acc[parent].select = {};
        acc[parent].select[child] = true;
      }
    } else {
      acc[field] = true;
    }
    return acc;
  }, {} as Record<string, any>);
}

export function createSearchFilter(
  search: string,
  fields: string[]
): Record<string, any> {
  if (!search) return {};
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive',
      },
    })),
  };
}

// ==================== PERFORMANCE MONITORING ====================

export class PerformanceMonitor {
  private startTime: number;
  private checkpoints: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
  }

  checkpoint(name: string): void {
    this.checkpoints.set(name, performance.now());
  }

  getDuration(checkpointName?: string): number {
    const endTime = checkpointName 
      ? this.checkpoints.get(checkpointName) || performance.now()
      : performance.now();
    return Math.round(endTime - this.startTime);
  }

  getReport(): Record<string, number> {
    const report: Record<string, number> = {
      total: this.getDuration(),
    };

    let prevTime = this.startTime;
    for (const [name, time] of this.checkpoints) {
      report[name] = Math.round(time - prevTime);
      prevTime = time;
    }

    return report;
  }

  log(operation: string): void {
    const duration = this.getDuration();
    if (duration > 1000) {
      console.warn(`🐌 Slow operation detected: ${operation} took ${duration}ms`);
    } else if (duration > 500) {
      console.log(`⚠️ Moderate operation: ${operation} took ${duration}ms`);
    } else {
      console.log(`⚡ Fast operation: ${operation} took ${duration}ms`);
    }
  }
}

// ==================== RATE LIMITING ====================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = config.keyGenerator ? config.keyGenerator(request) : 
    request.headers.get('x-forwarded-for') || 'default';
  
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Clean old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k);
    }
  }
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs };
  
  if (current.resetTime < now) {
    current.count = 0;
    current.resetTime = now + config.windowMs;
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    allowed: current.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current.count),
    resetTime: current.resetTime,
  };
}

// ==================== DATABASE CONNECTION OPTIMIZATION ====================

export const DB_CONFIG = {
  // Connection pool settings
  CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000'),
  
  // Query settings
  QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  SLOW_QUERY_THRESHOLD: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'),
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export function validateDatabaseHealth() {
  return {
    connectionPoolSize: DB_CONFIG.CONNECTION_LIMIT,
    connectionTimeout: DB_CONFIG.CONNECTION_TIMEOUT,
    queryTimeout: DB_CONFIG.QUERY_TIMEOUT,
    slowQueryThreshold: DB_CONFIG.SLOW_QUERY_THRESHOLD,
  };
}
