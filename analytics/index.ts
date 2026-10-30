/**
 * Analytics Module — Public API.
 *
 * App code imports from this module and nothing else.
 * This module implements the dataLayer contract (Parts 1–3).
 */

import type { ViolationMode } from './config';
import { state } from './state';
import { startVitals } from './vitals';
import { startScrollTracking } from './scroll';

// Re-export the public API
export { track, trackOnce, trackPageView } from './track';
export { noteAiRequestId, trackAiCall } from './trackAiCall';
export type { AiFeature, AiOutcome, TrackAiCallOptions } from './trackAiCall';
export { resolveExamCategory, setPracticeCategoriesProvider } from './examCategory';
export type { PracticeCategoryLike } from './examCategory';
export { toItem, buildEcommerce, MAX_LIST_ITEMS } from './ecommerce';
export type { ToItemInput, GA4Item } from './ecommerce';
export { normalizePlanSource } from './planSource';
export { identify, resetIdentity, normalizeTutorPlanStatus } from './identity';
export { usePageTracking } from './react';
export { SCHEMA_VERSION } from './plan.generated';
export type { IdentifyInput } from './identity';

export interface InitConfig {
  /** Violation mode: "throw" in tests, "warn" in dev, "silent" in production. */
  onViolation: ViolationMode;
}

/**
 * Initialize the analytics module. Call once in main.jsx before render.
 * Starts web-vitals and scroll tracking.
 */
export function initAnalytics(config: InitConfig): void {
  if (state.initialized) return;

  state.initialized = true;
  state.onViolation = config.onViolation;

  startVitals();
  startScrollTracking();
}
