/**
 * Web Vitals: LCP, INP, CLS — one event per metric per page load.
 * LCP and INP in milliseconds, CLS multiplied by 1000 and rounded.
 * metric_rating from the web-vitals library.
 */

import { track } from './track';

let started = false;

export function startVitals(): void {
  if (started) return;
  started = true;

  // Dynamic import so the module doesn't block the initial bundle parse.
  import('web-vitals').then(({ onLCP, onINP, onCLS }) => {
    const report = (name: string, value: number, rating: string) => {
      track('web_vitals', {
        metric_name: name,
        metric_value: Math.round(name === 'CLS' ? value * 1000 : value),
        metric_rating: rating,
      });
    };

    onLCP((m) => report('LCP', m.value, m.rating));
    onINP((m) => report('INP', m.value, m.rating));
    onCLS((m) => report('CLS', m.value, m.rating));
  }).catch(() => {
    // web-vitals not available — silently skip
  });
}
