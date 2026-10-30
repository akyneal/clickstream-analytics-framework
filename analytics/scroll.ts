/**
 * scroll_milestone at 50% and 90%, only when content_group is "public_content".
 * Throttled, reset on each route change (new page_view).
 */

import { trackOnce } from './track';
import { state } from './state';

const MILESTONES = [50, 90];
let cleanupFn: (() => void) | null = null;

function getScrollPercent(): number {
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  if (docHeight <= 0) return 0;
  return Math.round((window.scrollY / docHeight) * 100);
}

function onScroll(): void {
  if (!state.currentPage || state.currentPage.content_group !== 'public_content') return;
  const pct = getScrollPercent();
  for (const milestone of MILESTONES) {
    if (pct >= milestone) {
      trackOnce(`scroll:${milestone}`, 'scroll_milestone', { scroll_percent: milestone });
    }
  }
}

/** Start listening. Called by initAnalytics. */
export function startScrollTracking(): void {
  if (typeof window === 'undefined') return;

  let ticking = false;
  const handler = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
  cleanupFn = () => window.removeEventListener('scroll', handler);
}

/** Stop listening. */
export function stopScrollTracking(): void {
  cleanupFn?.();
  cleanupFn = null;
}
