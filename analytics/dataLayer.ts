/**
 * The ONLY file that touches window.dataLayer.
 * Implements the two-push envelope from the contract (Part 1).
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function generateEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without randomUUID
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function ensureDataLayer(): Record<string, unknown>[] {
  if (typeof window === 'undefined') return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

export interface PushOptions {
  eventCallback?: () => void;
  eventTimeout?: number;
}

/**
 * Push an event using the two-push envelope.
 * 1. Reset: { event_params: null, ecommerce: null }
 * 2. Event: { event, event_id, event_params, page?, ecommerce? }
 */
export function pushEvent(
  event: string,
  eventParams: Record<string, unknown>,
  options?: {
    page?: Record<string, unknown>;
    ecommerce?: Record<string, unknown>;
    pushOptions?: PushOptions;
  },
): void {
  const dl = ensureDataLayer();
  if (dl.length === 0 && typeof window === 'undefined') return;

  // Push 1: reset stale parameters
  dl.push({ event_params: null, ecommerce: null });

  // Push 2: the event
  const push: Record<string, unknown> = {
    event,
    event_id: generateEventId(),
    event_params: eventParams,
  };

  if (options?.page) {
    push.page = options.page;
  }
  if (options?.ecommerce) {
    push.ecommerce = options.ecommerce;
  }
  if (options?.pushOptions?.eventCallback) {
    push.eventCallback = options.pushOptions.eventCallback;
  }
  if (options?.pushOptions?.eventTimeout) {
    push.eventTimeout = options.pushOptions.eventTimeout;
  }

  dl.push(push);
}

/**
 * Push a context object (user, app) without the event envelope.
 * Used by identify() and resetIdentity().
 */
export function pushContext(obj: Record<string, unknown>): void {
  const dl = ensureDataLayer();
  dl.push(obj);
}
