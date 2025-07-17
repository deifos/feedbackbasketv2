import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a DOMPurify instance for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes all HTML tags and returns plain text
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove all HTML tags and return plain text
  return purify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize text input by trimming and removing potentially dangerous characters
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return (
    input
      .trim()
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  );
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return (
    input
      .trim()
      .toLowerCase()
      // Remove any characters that shouldn't be in an email
      .replace(/[^\w@.-]/g, '')
  );
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    const url = new URL(input.trim());
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
    return url.toString();
  } catch {
    return '';
  }
}

/**
 * Comprehensive sanitization for feedback content
 */
export function sanitizeFeedbackContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // First sanitize HTML to prevent XSS
  const htmlSanitized = sanitizeHtml(content);

  // Then sanitize text for additional safety
  return sanitizeText(htmlSanitized);
}

/**
 * Sanitize project name
 */
export function sanitizeProjectName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return sanitizeText(name);
}

/**
 * Sanitize notes content
 */
export function sanitizeNotes(notes: string): string {
  if (!notes || typeof notes !== 'string') {
    return '';
  }

  return sanitizeFeedbackContent(notes);
}
