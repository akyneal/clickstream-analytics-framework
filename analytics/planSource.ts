/**
 * Normalize backend study-plan source values to schema plan_source values.
 *
 * Known mappings:
 *   "score-upload"  → "score_report"
 *   "from-scratch"  → "scratch"
 *   undefined/null with testProgressId → "test_result"
 *   anything else   → undefined (dev warning)
 */

const PLAN_SOURCE_MAP: Record<string, string> = {
  'score-upload': 'score_report',
  'from-scratch': 'scratch',
};

export function normalizePlanSource(
  source: string | undefined | null,
  testProgressId?: string | undefined | null,
): string | undefined {
  if (!source) {
    // Test-result plans have no source field but do have a testProgressId
    return testProgressId ? 'test_result' : undefined;
  }
  const mapped = PLAN_SOURCE_MAP[source];
  if (!mapped) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[analytics] Unknown study plan source: "${source}"`);
    }
    return undefined;
  }
  return mapped;
}
