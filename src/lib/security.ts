import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns URL-safe base64 encoded token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate a proposal access token with expiration
 * @param expirationHours - Hours until token expires (default: 30 days)
 * @returns Object with token and expiration date
 */
export function generateProposalAccessToken(expirationHours: number = 720) {
  const token = generateSecureToken(48); // 48 bytes = 64 chars base64url
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);
  
  return {
    token,
    expiresAt,
  };
}

/**
 * Validate if a token has expired
 * @param expiresAt - Expiration date
 * @returns Boolean indicating if token is still valid
 */
export function isTokenValid(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() < new Date(expiresAt);
}

/**
 * Simple in-memory rate limiter for preventing abuse
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || now > record.resetAt) {
    // New window
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxAttempts - 1, resetAt };
  }

  if (record.count >= maxAttempts) {
    // Limit exceeded
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  // Increment counter
  record.count++;
  rateLimitStore.set(identifier, record);
  return { allowed: true, remaining: maxAttempts - record.count, resetAt: record.resetAt };
}

/**
 * Get client IP address from request headers
 * Handles various proxy scenarios
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback
  return 'unknown';
}
