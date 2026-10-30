/**
 * trackAiCall — wraps any AI call promise with ai_request tracking.
 *
 * Contract:
 * 1. Returns the original result or rethrows the original error, unchanged.
 * 2. Never delays the result (track is fire-and-forget).
 * 3. Metric extraction and track() are wrapped in try/catch — tracking
 *    failures never break the app.
 * 4. User-initiated aborts (AbortError) produce no ai_request event.
 * 5. Only lengths and counts are sent — never text.
 */

import { track } from './track';

// ── Types ────────────────────────────────────────────────

export type AiFeature =
  | 'question_hint'
  | 'question_tutor_chat'
  | 'essay_ideas'
  | 'essay_feedback'
  | 'recommendation_letter'
  | 'course_plan_outline'
  | 'course_plan_chat'
  | 'ai_question_generate'
  | 'pdf_question_generate'
  | 'study_plan'
  | 'predicted_test'
  | 'predicted_question';

export type AiOutcome = 'success' | 'error' | 'policy_blocked' | 'limit_hit' | 'empty';

export interface TrackAiCallOptions {
  inputChars?: number;
  turnNumber?: number;
  deriveOutput?: (result: unknown) => {
    outputChars?: number;
    outputItems?: number;
    aiResultScore?: number;
  };
  isPolicyBlocked?: (result: unknown) => boolean;
  isEmpty?: (result: unknown) => boolean;
}

// ── Helpers ──────────────────────────────────────────────

function isAbortError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'AbortError') return true;
  return false;
}

function isLimitError(err: unknown): boolean {
  const resp = (err as any)?.response;
  const data = resp?.data;
  // Axios-style: 429 + DAILY_LIMIT_EXCEEDED
  if (resp?.status === 429 && data?.error === 'DAILY_LIMIT_EXCEEDED') return true;
  // Axios-style: AI_TOKEN_LIMIT_EXCEEDED (any status)
  if (data?.code === 'AI_TOKEN_LIMIT_EXCEEDED') return true;
  // Re-thrown plain objects from study plan services: { error: 'DAILY_LIMIT_EXCEEDED' }
  if ((err as any)?.error === 'DAILY_LIMIT_EXCEEDED') return true;
  if ((err as any)?.code === 'AI_TOKEN_LIMIT_EXCEEDED') return true;
  return false;
}

function extractErrorCode(err: unknown): string | undefined {
  const resp = (err as any)?.response;
  const data = resp?.data;
  const code = data?.code ?? data?.error ?? (resp?.status ? `HTTP_${resp.status}` : undefined);
  if (code) return String(code).slice(0, 100);
  // Re-thrown plain object
  const plainCode = (err as any)?.code ?? (err as any)?.error;
  if (plainCode) return String(plainCode).slice(0, 100);
  // Last resort: error message (truncated)
  if (err instanceof Error && err.message) return err.message.slice(0, 80);
  return undefined;
}

function extractRequestId(obj: unknown): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as any;
  // From response body
  return o.requestId ?? o.request_id
    // From axios response wrapper
    ?? o.response?.data?.requestId ?? o.response?.data?.request_id
    ?? undefined;
}

// Calls whose service returns only part of the body (e.g. a study plan id)
// lose the body's requestId, so the API client also reports the X-Request-Id
// header here and in-flight calls take the first one they see.
const inFlightCalls = new Set<{ requestId?: string }>();

export function noteAiRequestId(requestId: string | undefined): void {
  if (!requestId) return;
  inFlightCalls.forEach((c) => { c.requestId ??= requestId; });
}

// ── Main ─────────────────────────────────────────────────

export async function trackAiCall<T>(
  feature: AiFeature,
  call: () => Promise<T>,
  options?: TrackAiCallOptions,
): Promise<T> {
  const t0 = performance.now();
  const inFlight: { requestId?: string } = {};
  let result: T;

  inFlightCalls.add(inFlight);
  try {
    result = await call();
  } catch (err) {
    inFlightCalls.delete(inFlight);
    // Abort: no event (Addition 3)
    if (isAbortError(err)) throw err;

    const latencyMs = Math.round(performance.now() - t0);
    const outcome: AiOutcome = isLimitError(err) ? 'limit_hit' : 'error';

    try {
      track('ai_request', {
        ai_feature: feature,
        ai_outcome: outcome,
        latency_ms: latencyMs,
        error_code: extractErrorCode(err),
        input_chars: options?.inputChars,
        turn_number: options?.turnNumber,
        ai_request_id: extractRequestId(err) ?? inFlight.requestId,
      });
    } catch {
      // Tracking must never break the app
    }

    throw err; // rethrow unchanged
  }
  inFlightCalls.delete(inFlight);

  // Success path
  const latencyMs = Math.round(performance.now() - t0);
  let outcome: AiOutcome = 'success';
  let output: { outputChars?: number; outputItems?: number; aiResultScore?: number } = {};

  try {
    if (options?.isPolicyBlocked?.(result)) {
      outcome = 'policy_blocked';
    } else if (options?.isEmpty?.(result)) {
      outcome = 'empty';
    }
    output = options?.deriveOutput?.(result) ?? {};
  } catch (extractErr) {
    if (typeof console !== 'undefined') {
      console.warn('[analytics] ai_request extraction failed', extractErr);
    }
  }

  try {
    track('ai_request', {
      ai_feature: feature,
      ai_outcome: outcome,
      latency_ms: latencyMs,
      input_chars: options?.inputChars,
      output_chars: output.outputChars,
      output_items: output.outputItems,
      ai_result_score: output.aiResultScore,
      turn_number: options?.turnNumber,
      ai_request_id: extractRequestId(result) ?? inFlight.requestId,
    });
  } catch {
    // Tracking must never break the app
  }

  return result; // return unchanged
}
