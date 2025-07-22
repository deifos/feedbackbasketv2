import { randomBytes } from 'crypto';

/**
 * Generate a secure API key with FeedbackBasket prefix
 */
export function generateApiKey(): string {
  // Generate 32 random bytes and convert to hex
  const randomHex = randomBytes(32).toString('hex');
  
  // Add feedbackbasket prefix for easy identification
  return `fb_key_${randomHex}`;
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^fb_key_[a-f0-9]{64}$/.test(key);
}

/**
 * Extract API key from Authorization header
 */
export function extractApiKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) return null;
  
  const key = match[1];
  return isValidApiKeyFormat(key) ? key : null;
}