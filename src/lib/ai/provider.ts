import LocalProvider from './providers/localProvider';

export interface IProvider {
  generateCompletion(messages: any[], options?: any): Promise<any>;
  generateStructuredCompletion<T = unknown>(messages: any[], options?: any): Promise<{ data: T; usage?: any; model: string }>;
  embedText?(texts: string[]): Promise<number[][]> | Promise<null>;
  searchEmbeddings?(query: string, topK?: number): Promise<Array<{ id: string; score: number; metadata?: Record<string, any> }>>;
  healthCheck?(): Promise<boolean>;
}

export function createProvider(): IProvider {
  return new LocalProvider();
}

export const provider: IProvider = createProvider();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
export function checkRateLimit(userId: string, maxRequests: number = 20, windowMs: number = 60 * 60 * 1000) {
  const now = Date.now();
  const key = userId;
  const existing = rateLimitMap.get(key);
  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }
  if (existing.count >= maxRequests) return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  existing.count += 1;
  rateLimitMap.set(key, existing);
  return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
}

export default provider;
