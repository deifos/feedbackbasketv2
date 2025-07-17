import { NextRequest } from 'next/server';

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

/**
 * Simple rate limiting function
 * @param request - The Next.js request object
 * @param options - Rate limiting options
 * @returns Object with isAllowed boolean and remaining requests
 */
export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = { maxRequests: 5, windowMs: 60000 } // 5 requests per minute by default
): { isAllowed: boolean; remaining: number; resetTime: number } {
  // Get client IP address
  const ip = getClientIP(request);
  const now = Date.now();
  const key = `${ip}:${request.nextUrl.pathname}`;

  // Clean up expired entries
  cleanupExpiredEntries(now);

  // Get or create rate limit entry
  const entry = rateLimitMap.get(key);

  if (!entry) {
    // First request from this IP
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });

    return {
      isAllowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs,
    };
  }

  // Check if window has expired
  if (now > entry.resetTime) {
    // Reset the window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });

    return {
      isAllowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= options.maxRequests) {
    return {
      isAllowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  return {
    isAllowed: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default IP if none found
  return 'unknown';
}

/**
 * Clean up expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Rate limit specifically for feedback submissions
 */
export function rateLimitFeedback(request: NextRequest) {
  return rateLimit(request, {
    maxRequests: 5, // 5 feedback submissions
    windowMs: 60000, // per minute
  });
}

/**
 * Rate limit for project creation
 */
export function rateLimitProjectCreation(request: NextRequest) {
  return rateLimit(request, {
    maxRequests: 3, // 3 project creations
    windowMs: 300000, // per 5 minutes
  });
}
