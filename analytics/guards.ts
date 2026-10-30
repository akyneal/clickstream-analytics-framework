/**
 * Event allowlist and parameter validation.
 * All rules derived from plan.generated.ts and config.ts.
 */

import { PII_KEYS, EMAIL_RE, MAX_STRING_LENGTH } from './config';
import { state } from './state';
import {
  CLIENT_EVENT_SET,
  DEPRECATED_EVENTS,
  SERVER_ONLY_EVENTS,
  EVENT_PARAMS,
  PARAM_TYPES,
  type EventName,
} from './plan.generated';

/** Legacy test_type values that need normalizing before the push. */
const TEST_TYPE_NORMALIZE: Record<string, string> = {
  'predicted': 'predicted_test',
};

/** Report a violation per the current onViolation mode. Returns true if the event should be dropped. */
export function violation(message: string): boolean {
  if (state.onViolation === 'throw') {
    throw new Error(`[analytics] ${message}`);
  }
  if (state.onViolation === 'warn') {
    console.warn(`[analytics] ${message}`);
  }
  return true; // always drop the offending item
}

/** Check that the event name is valid for client-side pushing. */
export function validateEventName(name: string): boolean {
  if (DEPRECATED_EVENTS.includes(name)) {
    violation(`Rejected deprecated event "${name}".`);
    return false;
  }
  if ((SERVER_ONLY_EVENTS as readonly string[]).includes(name)) {
    violation(`Rejected server-only event "${name}".`);
    return false;
  }
  if (!CLIENT_EVENT_SET.has(name)) {
    violation(`Rejected unknown event "${name}".`);
    return false;
  }
  return true;
}

/**
 * Filter and validate parameters for an event.
 * Returns a cleaned copy. Drops unknown, PII, email-valued, empty, and wrong-type params.
 * Truncates strings to MAX_STRING_LENGTH. Coerces integers and booleans.
 */
export function filterParams(
  eventName: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const allowedSet = EVENT_PARAMS[eventName as EventName];
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    // Drop PII keys
    if (PII_KEYS.has(key)) {
      violation(`Dropped PII key "${key}" on event "${eventName}".`);
      continue;
    }

    // Drop unknown params
    if (allowedSet && !allowedSet.has(key)) {
      violation(`Dropped unknown parameter "${key}" on event "${eventName}".`);
      continue;
    }

    // Drop empty values (null, undefined, empty string)
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Check string values for email patterns
    if (typeof value === 'string' && EMAIL_RE.test(value)) {
      violation(`Dropped parameter "${key}" on "${eventName}": value looks like an email.`);
      continue;
    }

    // Normalize test_type values (P2-C1: "predicted" → "predicted_test")
    if (key === 'test_type' && typeof value === 'string' && TEST_TYPE_NORMALIZE[value]) {
      clean[key] = TEST_TYPE_NORMALIZE[value];
      continue;
    }

    // Type checking and coercion
    const expectedType = PARAM_TYPES[key];
    let finalValue = value;

    if (expectedType === 'integer' || expectedType === 'number') {
      const num = Number(value);
      if (Number.isNaN(num)) {
        violation(`Dropped parameter "${key}" on "${eventName}": expected number, got ${typeof value}.`);
        continue;
      }
      finalValue = expectedType === 'integer' ? Math.round(num) : num;
    } else if (expectedType === 'boolean') {
      if (typeof value === 'string') {
        finalValue = value === 'true';
      } else if (typeof value !== 'boolean') {
        finalValue = Boolean(value);
      }
    } else if (expectedType === 'array') {
      if (!Array.isArray(value)) {
        violation(`Dropped parameter "${key}" on "${eventName}": expected array.`);
        continue;
      }
      finalValue = value;
    } else {
      // string or unknown type
      if (typeof value !== 'string') {
        finalValue = String(value);
      }
    }

    // Truncate strings
    if (typeof finalValue === 'string' && finalValue.length > MAX_STRING_LENGTH) {
      finalValue = finalValue.slice(0, MAX_STRING_LENGTH);
    }

    clean[key] = finalValue;
  }

  return clean;
}
