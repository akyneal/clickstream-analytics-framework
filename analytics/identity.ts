/**
 * User identity management.
 * identify() and resetIdentity() push the complete user object.
 */

import { NUMERIC_ROLE_MAP, VALID_ROLES } from './config';
import { pushContext } from './dataLayer';
import { state } from './state';

export interface IdentifyInput {
  /** Firebase UID — the opaque backend user ID. Never an email or name. */
  uid: string | null;
  role: string | number | null | undefined;
  /** Whether the user is actually signed in (authStore isAuthenticated + token + user present). */
  isSignedIn: boolean;
  tutorPlanStatus?: string | null;
  tutorVerified?: boolean | null;
  primaryExam?: string | null;
  hasLinkedTutor?: boolean | null;
}

/**
 * Normalize tutor plan status to plan values: trial, free, monthly, yearly, time_limited, expired.
 * Returns null for non-tutors (students, parents get null, not "free").
 */
export function normalizeTutorPlanStatus(
  role: string | number | null | undefined,
  subscriptionStatus: string | null | undefined,
  planType: string | null | undefined,
): string | null {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole !== 'tutor') return null;

  if (!subscriptionStatus) return 'free';

  const status = subscriptionStatus.toLowerCase();
  if (status === 'trial' || status === 'trialing') return 'trial';
  if (status === 'expired' || status === 'canceled' || status === 'past_due' || status === 'unpaid') return 'expired';
  if (status === 'active') {
    const type = (planType || '').toLowerCase();
    if (type === 'monthly') return 'monthly';
    if (type === 'yearly') return 'yearly';
    if (type === 'time_limited') return 'time_limited';
    return 'free';
  }
  return 'free';
}

/** Normalize role from either enum to the plan's string values. */
export function normalizeRole(role: string | number | null | undefined): string {
  if (role === null || role === undefined) return 'anonymous';
  if (typeof role === 'number') {
    return NUMERIC_ROLE_MAP[role] ?? 'anonymous';
  }
  const lower = String(role).toLowerCase();
  return VALID_ROLES.has(lower) ? lower : 'anonymous';
}

/** Push the full user context. Every key is always present; missing values are null. */
export function identify(user: IdentifyInput): void {
  const role = normalizeRole(user.role);

  const userContext = {
    user: {
      user_id: user.uid ?? null,
      user_role: role,
      login_state: user.isSignedIn ? 'signed_in' : 'signed_out',
      traffic_type: role === 'admin' ? 'internal' : null,
      properties: {
        tutor_plan_status: user.tutorPlanStatus ?? null,
        tutor_verified: user.tutorVerified ?? null,
        primary_exam: user.primaryExam ?? null,
        has_linked_tutor: user.hasLinkedTutor ?? null,
      },
    },
  };

  state.currentUser = {
    user_id: userContext.user.user_id,
    user_role: userContext.user.user_role,
    login_state: userContext.user.login_state,
    traffic_type: userContext.user.traffic_type,
  };

  pushContext(userContext);
}

/** Push the anonymous/signed-out user context with all keys null. */
export function resetIdentity(): void {
  const userContext = {
    user: {
      user_id: null,
      user_role: 'anonymous',
      login_state: 'signed_out',
      traffic_type: null,
      properties: {
        tutor_plan_status: null,
        tutor_verified: null,
        primary_exam: null,
        has_linked_tutor: null,
      },
    },
  };

  state.currentUser = {
    user_id: null,
    user_role: 'anonymous',
    login_state: 'signed_out',
    traffic_type: null,
  };

  pushContext(userContext);
}
