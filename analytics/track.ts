/**
 * track, trackOnce, trackPageView, and the guard pipeline.
 * Replaces the Round 1 temporary wrapper.
 */

import { pushEvent } from './dataLayer';
import { validateEventName, filterParams, violation } from './guards';
import { TUTOR_MODE_SUPPRESSED } from './plan.generated';
import { resolveRoute, sanitizePageUrl, sanitizeReferrer, stripStudentId, isTutorMode } from './route';
import { state, resetOnceKeys } from './state';
import type { PageContext } from './state';

// ── Guard pipeline ───────────────────────────────────────
// Order from Phase 2.1:
//   1. Name allowlist (exists, not deprecated, not server_only)
//   2. Page context exists (unmapped routes drop silently)
//   3. Tutor-mode substitution
//   4. Per-parameter filtering
//   5. Two-push envelope

/**
 * Push a tracked event through the full guard pipeline.
 * Drops the event (with a violation) if any guard fails.
 */
export function track(
  name: string,
  params: Record<string, unknown> = {},
  options?: { ecommerce?: Record<string, unknown> },
): void {
  try {
    // 1. Name allowlist
    if (!validateEventName(name)) return;

    // 2. Page context must exist (a page_view must have fired)
    if (!state.currentPage) {
      violation(`Event "${name}" fired before any page_view.`);
      return;
    }

    // 3. Tutor-mode substitution
    if (state.currentPage && TUTOR_MODE_SUPPRESSED.has(name)) {
      const loc = typeof window !== 'undefined' ? window.location?.search ?? '' : '';
      if (isTutorMode(loc)) {
        // Replace student activity events with one student_work_view per page view
        if (!state.tutorWorkViewFired) {
          state.tutorWorkViewFired = true;
          const workType = name.startsWith('task_') || name.startsWith('subtask_') || name === 'study_plan_open'
            ? 'study_plan'
            : name === 'mistake_dismiss'
              ? 'mistakes_review'
              : 'test_review';
          // Determine test_type from the original params if available
          const replacementParams: Record<string, unknown> = { work_type: workType };
          if (params.test_type) replacementParams.test_type = params.test_type;
          const filtered = filterParams('student_work_view', replacementParams);
          pushEvent('student_work_view', filtered);
        }
        return; // Always drop the original student activity event
      }
    }

    // 4. Per-parameter filtering
    const filtered = filterParams(name, params);

    // 5. Push envelope
    pushEvent(name, filtered, {
      ecommerce: options?.ecommerce,
    });
  } catch (e) {
    // In throw mode, let it propagate
    if (state.onViolation === 'throw') throw e;
    // Otherwise, tracking must never crash the app
  }
}

/**
 * Push an event only once per key per page view.
 * Useful for Page-tier events and anything fired from effects (StrictMode).
 */
export function trackOnce(
  key: string,
  name: string,
  params: Record<string, unknown> = {},
  options?: { ecommerce?: Record<string, unknown> },
): void {
  if (state.onceKeys.has(key)) return;
  state.onceKeys.add(key);
  track(name, params, options);
}

/**
 * Push a page_view event with page context.
 * Called by usePageTracking on each route change.
 */
export function trackPageView(location: { pathname: string; search: string }): void {
  try {
    const match = resolveRoute(location.pathname);

    // Unmapped routes send nothing
    if (!match) return;

    // Deduplicate: one page_view per distinct path+search
    const pageKey = location.pathname + location.search;
    if (pageKey === state.lastPageKey) return;
    state.lastPageKey = pageKey;

    // Build page_location
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.example.com';
    const cleanSearch = stripStudentId(location.search);
    const rawUrl = origin + location.pathname + cleanSearch;
    const pageLocation = sanitizePageUrl(rawUrl);

    // page_referrer: previous in-app URL, or external referrer on first page
    let pageReferrer: string | null;
    if (state.previousUrl) {
      pageReferrer = state.previousUrl;
    } else if (typeof document !== 'undefined' && document.referrer) {
      pageReferrer = sanitizeReferrer(document.referrer);
    } else {
      pageReferrer = null;
    }

    const pageContext: PageContext = {
      page_template: match.page_template,
      content_group: match.content_group,
      page_location: pageLocation,
      page_referrer: pageReferrer,
    };

    // Update state
    state.currentPage = pageContext;
    state.previousUrl = pageLocation;
    resetOnceKeys();

    // Build the page object for the push
    const page: Record<string, unknown> = {
      page_template: pageContext.page_template,
      content_group: pageContext.content_group,
      page_location: pageContext.page_location,
      page_referrer: pageContext.page_referrer,
    };

    // Determine is_public_view
    const isSignedOut = !state.currentUser || state.currentUser.user_role === 'anonymous';
    const eventParams: Record<string, unknown> = {
      is_public_view: isSignedOut,
    };

    const filtered = filterParams('page_view', eventParams);

    pushEvent('page_view', filtered, { page });
  } catch (e) {
    if (state.onViolation === 'throw') throw e;
  }
}

