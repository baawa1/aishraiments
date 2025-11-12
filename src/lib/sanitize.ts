import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param dirty - The unsanitized user input
 * @param allowHtml - Whether to allow safe HTML tags (default: false)
 * @returns Sanitized string safe for storage and display
 */
export function sanitizeInput(dirty: string | null | undefined, allowHtml: boolean = false): string {
  if (!dirty) return '';

  if (typeof window === 'undefined') {
    // Server-side: basic sanitization
    return String(dirty)
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim();
  }

  // Client-side: use DOMPurify
  if (allowHtml) {
    // Allow only safe HTML tags
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href'],
    });
  }

  // Strip all HTML
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitizes an object's string properties
 * @param obj - Object with string properties to sanitize
 * @returns Object with sanitized properties
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validates and sanitizes email addresses
 * @param email - Email to validate
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const sanitized = sanitizeInput(email).toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Validates and sanitizes phone numbers
 * @param phone - Phone number to validate
 * @returns Sanitized phone number or null if invalid
 */
export function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except + and spaces
  const sanitized = String(phone)
    .replace(/[^\d+\s()-]/g, '')
    .trim();

  return sanitized || null;
}
