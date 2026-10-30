/** Static rules for the analytics module. Content groups come from plan.generated.ts. */

/** Keys that are always stripped from event params, regardless of schema. */
export const PII_KEYS = new Set([
  'email', 'name', 'first_name', 'last_name', 'phone',
  'dob', 'message', 'text', 'body', 'address', 'ssn',
]);

/** Matches strings that look like an email address. */
export const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/** Maximum string length for any parameter value. */
export const MAX_STRING_LENGTH = 100;

/** Query parameters allowed in page_location (all others stripped). */
export const ALLOWED_QUERY_KEYS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid',
]);

/** Query parameters that are converted to boolean flags instead of kept as values. */
export const BOOLEAN_QUERY_KEYS: Record<string, string> = {
  referralId: 'has_referral',
};

/** Numeric role → analytics role string. */
export const NUMERIC_ROLE_MAP: Record<number, string> = {
  0: 'admin',
  1: 'student',
  2: 'tutor',
  3: 'parent',
};

/** String role enum values accepted as-is. */
export const VALID_ROLES = new Set(['student', 'parent', 'tutor', 'admin']);

export type ViolationMode = 'throw' | 'warn' | 'silent';

export interface AnalyticsConfig {
  onViolation: ViolationMode;
}
