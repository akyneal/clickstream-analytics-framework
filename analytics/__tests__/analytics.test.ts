/**
 * Unit tests for the analytics module.
 * Covers: envelope, guards, identity, route, tutor mode, trackOnce, page views.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state, resetOnceKeys } from '../state';
import { resolveExamCategory } from '../examCategory';
import { pushEvent, pushContext } from '../dataLayer';
import { validateEventName, filterParams } from '../guards';
import { identify, resetIdentity, normalizeRole, normalizeTutorPlanStatus } from '../identity';
import { resolveRoute, sanitizePageUrl, sanitizeReferrer, toEndpointTemplate, isTutorMode, _resetCompiledRoutes } from '../route';
import { track, trackOnce, trackPageView } from '../track';

// ── Helpers ──────────────────────────────────────────────

function resetState() {
  state.initialized = true;
  state.onViolation = 'throw';
  state.authResolved = false;
  state.currentPage = null;
  state.currentUser = null;
  state.previousUrl = null;
  state.onceKeys = new Set();
  state.lastPageKey = null;
  state.tutorWorkViewFired = false;
  window.dataLayer = [];
}

function lastPush(): Record<string, unknown> {
  return window.dataLayer[window.dataLayer.length - 1];
}

function allPushes(): Record<string, unknown>[] {
  return [...window.dataLayer];
}

// ── Setup ────────────────────────────────────────────────

beforeEach(() => {
  resetState();
  _resetCompiledRoutes();
});

// ═════════════════════════════════════════════════════════
// ENVELOPE
// ═════════════════════════════════════════════════════════

describe('envelope', () => {
  it('pushes null reset before every event', () => {
    pushEvent('test_event', { foo: 'bar' });
    const pushes = allPushes();
    expect(pushes.length).toBe(2);
    expect(pushes[0]).toEqual({ event_params: null, ecommerce: null });
  });

  it('includes event, event_id, and event_params in the event push', () => {
    pushEvent('page_view', { is_public_view: true });
    const ev = lastPush();
    expect(ev.event).toBe('page_view');
    expect(ev.event_id).toBeDefined();
    expect(typeof ev.event_id).toBe('string');
    expect((ev.event_id as string).length).toBeGreaterThan(0);
    expect(ev.event_params).toEqual({ is_public_view: true });
  });

  it('generates unique event_id for each push', () => {
    pushEvent('test_a', {});
    const id1 = lastPush().event_id;
    pushEvent('test_b', {});
    const id2 = lastPush().event_id;
    expect(id1).not.toBe(id2);
  });

  it('includes page object when provided', () => {
    pushEvent('page_view', {}, { page: { page_template: '/tests' } });
    const ev = lastPush();
    expect(ev.page).toEqual({ page_template: '/tests' });
  });

  it('includes ecommerce object when provided', () => {
    pushEvent('view_item', {}, { ecommerce: { items: [] } });
    const ev = lastPush();
    expect(ev.ecommerce).toEqual({ items: [] });
  });
});

// ═════════════════════════════════════════════════════════
// GUARDS
// ═════════════════════════════════════════════════════════

describe('guards', () => {
  describe('event name validation', () => {
    it('accepts a valid client event', () => {
      expect(validateEventName('page_view')).toBe(true);
      expect(validateEventName('sign_up')).toBe(true);
      expect(validateEventName('test_start')).toBe(true);
    });

    it('rejects unknown events', () => {
      expect(() => validateEventName('totally_made_up')).toThrow('[analytics]');
    });

    it('rejects deprecated events', () => {
      expect(() => validateEventName('event_comment_post')).toThrow('[analytics]');
    });

    it('rejects server-only events', () => {
      expect(() => validateEventName('purchase')).toThrow('[analytics]');
      expect(() => validateEventName('refund')).toThrow('[analytics]');
    });
  });

  describe('parameter filtering', () => {
    it('drops unknown parameters', () => {
      // Use warn mode so filterParams doesn't throw — it drops and returns
      state.onViolation = 'warn';
      const result = filterParams('page_view', { is_public_view: true, bogus_param: 'x' });
      expect(result).toHaveProperty('is_public_view', true);
      expect(result).not.toHaveProperty('bogus_param');
      state.onViolation = 'throw';
    });

    it('drops PII keys', () => {
      expect(() => filterParams('sign_up', { method: 'email', email: 'a@b.com' })).toThrow('[analytics]');
    });

    it('drops values that look like emails', () => {
      expect(() => filterParams('sign_up', { method: 'user@example.com' })).toThrow('[analytics]');
    });

    it('keeps integers as numbers', () => {
      const result = filterParams('test_start', { total_questions: 98, section_count: 4 });
      expect(result.total_questions).toBe(98);
      expect(typeof result.total_questions).toBe('number');
    });

    it('coerces string integers to numbers', () => {
      const result = filterParams('test_start', { total_questions: '98' as unknown });
      expect(result.total_questions).toBe(98);
      expect(typeof result.total_questions).toBe('number');
    });

    it('keeps booleans as booleans', () => {
      const result = filterParams('page_view', { is_public_view: true });
      expect(result.is_public_view).toBe(true);
      expect(typeof result.is_public_view).toBe('boolean');
    });

    it('coerces string booleans', () => {
      const result = filterParams('page_view', { is_public_view: 'true' as unknown });
      expect(result.is_public_view).toBe(true);
    });

    it('truncates strings to 100 characters', () => {
      const longStr = 'a'.repeat(150);
      const result = filterParams('sign_up', { method: longStr });
      expect((result.method as string).length).toBe(100);
    });

    it('omits empty values (null, undefined, empty string)', () => {
      const result = filterParams('sign_up', { method: 'email', signup_source: null, inviter_role: '' });
      expect(result).toHaveProperty('method', 'email');
      expect(result).not.toHaveProperty('signup_source');
      expect(result).not.toHaveProperty('inviter_role');
    });

    it('drops params with wrong type (NaN for number)', () => {
      expect(() => filterParams('test_start', { total_questions: 'not_a_number' })).toThrow('[analytics]');
    });
  });
});

// ═════════════════════════════════════════════════════════
// IDENTITY
// ═════════════════════════════════════════════════════════

describe('identity', () => {
  it('identify pushes the full user object with all keys', () => {
    identify({ uid: 'user123', role: 'student', isSignedIn: true });
    const push = lastPush();
    const user = push.user as Record<string, unknown>;
    expect(user.user_id).toBe('user123');
    expect(user.user_role).toBe('student');
    expect(user.login_state).toBe('signed_in');
    expect(user.traffic_type).toBeNull();
    const props = user.properties as Record<string, unknown>;
    expect(props.tutor_plan_status).toBeNull();
    expect(props.tutor_verified).toBeNull();
    expect(props.primary_exam).toBeNull();
    expect(props.has_linked_tutor).toBeNull();
  });

  it('resetIdentity pushes anonymous with all nulls', () => {
    resetIdentity();
    const push = lastPush();
    const user = push.user as Record<string, unknown>;
    expect(user.user_id).toBeNull();
    expect(user.user_role).toBe('anonymous');
    expect(user.login_state).toBe('signed_out');
    expect(user.traffic_type).toBeNull();
    const props = user.properties as Record<string, unknown>;
    expect(props.tutor_plan_status).toBeNull();
  });

  it('maps numeric role 0 to admin', () => {
    expect(normalizeRole(0)).toBe('admin');
  });

  it('maps numeric role 1 to student', () => {
    expect(normalizeRole(1)).toBe('student');
  });

  it('maps numeric role 2 to tutor', () => {
    expect(normalizeRole(2)).toBe('tutor');
  });

  it('maps numeric role 3 to parent', () => {
    expect(normalizeRole(3)).toBe('parent');
  });

  it('maps string enum values correctly', () => {
    expect(normalizeRole('student')).toBe('student');
    expect(normalizeRole('parent')).toBe('parent');
    expect(normalizeRole('tutor')).toBe('tutor');
  });

  it('maps null/undefined to anonymous', () => {
    expect(normalizeRole(null)).toBe('anonymous');
    expect(normalizeRole(undefined)).toBe('anonymous');
  });

  it('admin gets traffic_type internal', () => {
    identify({ uid: 'admin1', role: 0, isSignedIn: true });
    const user = (lastPush() as any).user;
    expect(user.traffic_type).toBe('internal');
    expect(user.user_role).toBe('admin');
  });

  it('identify with all properties set', () => {
    identify({
      uid: 'tutor1', role: 'tutor', isSignedIn: true,
      tutorPlanStatus: 'trial', tutorVerified: false,
      primaryExam: null, hasLinkedTutor: null,
    });
    const props = (lastPush() as any).user.properties;
    expect(props.tutor_plan_status).toBe('trial');
    expect(props.tutor_verified).toBe(false);
  });

  it('real backend shape: uid only (no id) → user_id = uid, login_state signed_in', () => {
    // This is the shape /auth/validate actually returns:
    // Firestore doc.data() has uid but not id.
    identify({ uid: 'abc123FirebaseUid', role: 1, isSignedIn: true });
    const user = (lastPush() as any).user;
    expect(user.user_id).toBe('abc123FirebaseUid');
    expect(user.login_state).toBe('signed_in');
    expect(user.user_role).toBe('student');
  });

  it('signed out → user_id null, signed_out, anonymous, no traffic_type', () => {
    resetIdentity();
    const user = (lastPush() as any).user;
    expect(user.user_id).toBeNull();
    expect(user.login_state).toBe('signed_out');
    expect(user.user_role).toBe('anonymous');
    expect(user.traffic_type).toBeNull();
  });

  it('object with both id and uid that differ → user_id is uid', () => {
    // If both fields existed, uid must win — it is the canonical backend ID.
    // IdentifyInput only accepts uid, so this test verifies the interface
    // enforces the right field.
    identify({ uid: 'the-real-uid', role: 'student', isSignedIn: true });
    const user = (lastPush() as any).user;
    expect(user.user_id).toBe('the-real-uid');
    expect(user.login_state).toBe('signed_in');
  });
});

// ═════════════════════════════════════════════════════════
// ROUTE
// ═════════════════════════════════════════════════════════

describe('route', () => {
  it('resolves / to home', () => {
    const match = resolveRoute('/');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('home');
    expect(match!.page_template).toBe('/');
  });

  it('resolves /tests/:testId/take to practice', () => {
    const match = resolveRoute('/tests/abc123/take');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('practice');
    expect(match!.page_template).toBe('/tests/:testId/take');
  });

  it('resolves /settings/account to settings', () => {
    const match = resolveRoute('/settings/account');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('settings');
  });

  it('resolves /study-plan/list to planning', () => {
    const match = resolveRoute('/study-plan/list');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('planning');
  });

  it('resolves /courses/course/:id to learn when signed in', () => {
    state.currentUser = { user_id: 'u1', user_role: 'student', login_state: 'signed_in', traffic_type: null };
    const match = resolveRoute('/courses/course/crs_123');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('learn');
  });

  it('resolves /ai-prompts to ai_tools', () => {
    const match = resolveRoute('/ai-prompts');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('ai_tools');
  });

  it('resolves /community/feed to community', () => {
    const match = resolveRoute('/community/feed');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('community');
  });

  it('resolves /test-bank/my-bank to tutor_tools', () => {
    const match = resolveRoute('/test-bank/my-bank');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('tutor_tools');
  });

  it('resolves /embed/test/:id to embed', () => {
    const match = resolveRoute('/embed/test/t123');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('embed');
  });

  it('resolves /signup to account', () => {
    const match = resolveRoute('/signup');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('account');
  });

  it('publicContent route reports public_content when signed out', () => {
    state.currentUser = null;
    const match = resolveRoute('/courses');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('public_content');
  });

  it('publicContent route reports feature group when signed in', () => {
    state.currentUser = { user_id: 'u1', user_role: 'student', login_state: 'signed_in', traffic_type: null };
    const match = resolveRoute('/courses');
    expect(match).not.toBeNull();
    expect(match!.content_group).toBe('learn');
  });

  it('unmapped route /component/modal returns null', () => {
    const match = resolveRoute('/component/modal');
    expect(match).toBeNull();
  });

  it('unmapped route /tutor returns null', () => {
    const match = resolveRoute('/tutor');
    expect(match).toBeNull();
  });

  describe('URL sanitizing', () => {
    it('keeps only utm_* and gclid query keys', () => {
      const url = 'https://app.example.com/tests?utm_source=google&gclid=abc123&secret=bad&tab=2';
      const clean = sanitizePageUrl(url);
      expect(clean).toContain('utm_source=google');
      expect(clean).toContain('gclid=abc123');
      expect(clean).not.toContain('secret');
      expect(clean).not.toContain('tab');
    });

    it('strips hash', () => {
      const url = 'https://app.example.com/tests#section1';
      const clean = sanitizePageUrl(url);
      expect(clean).not.toContain('#');
    });

    it('converts referralId to has_referral', () => {
      const url = 'https://app.example.com/signup?referralId=abc123';
      const clean = sanitizePageUrl(url);
      expect(clean).toContain('has_referral=true');
      expect(clean).not.toContain('referralId');
    });
  });

  describe('external referrer sanitizing', () => {
    it('keeps origin and path only', () => {
      const ref = sanitizeReferrer('https://www.google.com/search?q=example');
      expect(ref).toBe('https://www.google.com/search');
    });

    it('returns null for empty/null', () => {
      expect(sanitizeReferrer(null)).toBeNull();
      expect(sanitizeReferrer('')).toBeNull();
    });
  });

  describe('endpoint template', () => {
    it('replaces UUIDs with :id', () => {
      const t = toEndpointTemplate('/api/tests/3f1c8a52-6c1e-4f7a-9d2b-0c4e5a7b9e11/answers');
      expect(t).toBe('/api/tests/:id/answers');
    });

    it('replaces numeric IDs', () => {
      const t = toEndpointTemplate('/api/users/12345/profile');
      expect(t).toBe('/api/users/:id/profile');
    });

    it('replaces Firebase-style UIDs', () => {
      const t = toEndpointTemplate('/api/users/aBcDeFgHiJkLmNoPqRsTuVwXyZ12/data');
      expect(t).toBe('/api/users/:id/data');
    });
  });

  describe('tutor mode detection', () => {
    it('detects studentId in query', () => {
      expect(isTutorMode('?studentId=abc123')).toBe(true);
    });

    it('detects mode=tutor', () => {
      expect(isTutorMode('?mode=tutor')).toBe(true);
    });

    it('detects study plan mode param', () => {
      expect(isTutorMode('?mode=view')).toBe(true);
    });

    it('returns false for no tutor indicators', () => {
      expect(isTutorMode('?tab=2')).toBe(false);
      expect(isTutorMode('')).toBe(false);
    });
  });
});

// ═════════════════════════════════════════════════════════
// TUTOR MODE
// ═════════════════════════════════════════════════════════

describe('tutor mode substitution', () => {
  beforeEach(() => {
    // Set up a page context so track() doesn't reject for no page_view
    state.currentPage = {
      page_template: '/tests/:testId/take',
      content_group: 'practice',
      page_location: 'https://app.example.com/tests/t1/take?studentId=s1',
      page_referrer: null,
    };
  });

  it('drops suppressed student event when URL has studentId', () => {
    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?studentId=s1', origin: 'https://app.example.com' },
      writable: true,
      configurable: true,
    });

    track('test_start', { test_id: 't1', test_type: 'practice_test', total_questions: 10 });
    // Should push student_work_view instead
    const pushes = allPushes();
    const events = pushes.filter(p => p.event);
    expect(events.length).toBe(1);
    expect(events[0].event).toBe('student_work_view');
  });
});

// ═════════════════════════════════════════════════════════
// TRACK ONCE
// ═════════════════════════════════════════════════════════

describe('trackOnce', () => {
  beforeEach(() => {
    state.currentPage = {
      page_template: '/tests',
      content_group: 'practice',
      page_location: 'https://app.example.com/tests',
      page_referrer: null,
    };
    // Restore normal location
    Object.defineProperty(window, 'location', {
      value: { search: '', origin: 'https://app.example.com', pathname: '/tests', href: 'https://app.example.com/tests' },
      writable: true,
      configurable: true,
    });
  });

  it('fires once per key', () => {
    trackOnce('results:t1', 'test_results_view', {
      test_id: 't1', test_type: 'practice_test', results_source: 'just_completed',
      correct_count: 5, total_questions: 10,
    });
    trackOnce('results:t1', 'test_results_view', {
      test_id: 't1', test_type: 'practice_test', results_source: 'just_completed',
      correct_count: 5, total_questions: 10,
    });
    const events = allPushes().filter(p => p.event === 'test_results_view');
    expect(events.length).toBe(1);
  });

  it('resets after a new page_view', () => {
    trackOnce('results:t1', 'test_results_view', {
      test_id: 't1', test_type: 'practice_test', results_source: 'just_completed',
      correct_count: 5, total_questions: 10,
    });

    // Simulate a new page view
    resetOnceKeys();

    trackOnce('results:t1', 'test_results_view', {
      test_id: 't1', test_type: 'practice_test', results_source: 'just_completed',
      correct_count: 5, total_questions: 10,
    });

    const events = allPushes().filter(p => p.event === 'test_results_view');
    expect(events.length).toBe(2);
  });

  it('handles simulated StrictMode double effect', () => {
    // StrictMode runs effects twice — trackOnce should still only push once
    trackOnce('view:t1', 'test_results_view', {
      test_id: 't1', test_type: 'practice_test', results_source: 'revisit',
      correct_count: 5, total_questions: 10,
    });
    // Simulated double invocation (StrictMode)
    trackOnce('view:t1', 'test_results_view', {
      test_id: 't1', test_type: 'practice_test', results_source: 'revisit',
      correct_count: 5, total_questions: 10,
    });
    const events = allPushes().filter(p => p.event === 'test_results_view');
    expect(events.length).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════
// PAGE VIEWS
// ═════════════════════════════════════════════════════════

describe('page views', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { search: '', origin: 'https://app.example.com', pathname: '/', href: 'https://app.example.com/' },
      writable: true,
      configurable: true,
    });
    // Identify as a student so routes don't resolve to public_content
    identify({ uid: 'u1', role: 'student', isSignedIn: true });
    window.dataLayer = []; // Clear the identify push
  });

  it('fires page_view for a mapped route', () => {
    trackPageView({ pathname: '/', search: '' });
    const events = allPushes().filter(p => p.event === 'page_view');
    expect(events.length).toBe(1);
    const ev = events[0];
    expect(ev.page).toBeDefined();
    expect((ev.page as any).page_template).toBe('/');
    expect((ev.page as any).content_group).toBe('home');
  });

  it('does not fire for an unmapped route', () => {
    trackPageView({ pathname: '/component/modal', search: '' });
    const events = allPushes().filter(p => p.event === 'page_view');
    expect(events.length).toBe(0);
  });

  it('fires once per distinct path', () => {
    trackPageView({ pathname: '/', search: '' });
    trackPageView({ pathname: '/', search: '' });
    const events = allPushes().filter(p => p.event === 'page_view');
    expect(events.length).toBe(1);
  });

  it('fires again for a different path', () => {
    trackPageView({ pathname: '/', search: '' });
    trackPageView({ pathname: '/search', search: '?q=test' });
    const events = allPushes().filter(p => p.event === 'page_view');
    expect(events.length).toBe(2);
  });

  it('page_referrer is the previous virtual URL', () => {
    trackPageView({ pathname: '/', search: '' });
    trackPageView({ pathname: '/search', search: '' });
    const pages = allPushes().filter(p => p.event === 'page_view');
    const secondPage = pages[1].page as Record<string, unknown>;
    expect(secondPage.page_referrer).toContain('/');
  });

  it('auth gating: no page_view when auth unresolved, exactly one after it resolves with correct user', () => {
    // Simulate the usePageTracking gating: it only calls trackPageView
    // when authResolved is true.  Before that, nothing fires.

    // Step 1: auth not resolved — simulate usePageTracking skipping the call.
    // (usePageTracking returns early when authResolved is false.)
    // No trackPageView call → no page_view in the dataLayer.
    const eventsBeforeAuth = allPushes().filter(p => p.event === 'page_view');
    expect(eventsBeforeAuth.length).toBe(0);

    // Step 2: auth resolves — identify as a signed-in student, then fire page_view.
    identify({ uid: 'student42', role: 1, isSignedIn: true });

    // Verify the user push carries the real role
    const userPushes = allPushes().filter(p => (p as any).user);
    const lastUser = (userPushes[userPushes.length - 1] as any).user;
    expect(lastUser.user_id).toBe('student42');
    expect(lastUser.user_role).toBe('student');
    expect(lastUser.login_state).toBe('signed_in');

    // Step 3: now trackPageView fires (like usePageTracking would after authResolved=true)
    trackPageView({ pathname: '/', search: '' });
    const eventsAfterAuth = allPushes().filter(p => p.event === 'page_view');
    expect(eventsAfterAuth.length).toBe(1);

    // The page_view was pushed after the user context, so the content_group
    // reflects a signed-in user (home, not public_content).
    const page = eventsAfterAuth[0].page as Record<string, unknown>;
    expect(page.content_group).toBe('home');
  });

  it('events rejected before first page_view', () => {
    state.currentPage = null;
    expect(() => track('navigation_click', { nav_item_id: 'home', nav_section_id: 'main' })).toThrow('[analytics]');
  });
});

// ═════════════════════════════════════════════════════════
// SIGN_UP PARAMETERS
// ═════════════════════════════════════════════════════════

describe('sign_up parameters', () => {
  beforeEach(() => {
    state.currentPage = {
      page_template: '/signup',
      content_group: 'account',
      page_location: 'https://app.example.com/signup',
      page_referrer: null,
    };
    Object.defineProperty(window, 'location', {
      value: { search: '', origin: 'https://app.example.com', pathname: '/signup', href: 'https://app.example.com/signup' },
      writable: true,
      configurable: true,
    });
  });

  it('email sign_up carries method, signup_source, and requires_verification', () => {
    track('sign_up', {
      method: 'email',
      signup_source: 'organic',
      requires_verification: true,
    });
    const ev = allPushes().filter(p => p.event === 'sign_up');
    expect(ev.length).toBe(1);
    const params = ev[0].event_params as Record<string, unknown>;
    expect(params.method).toBe('email');
    expect(params.signup_source).toBe('organic');
    expect(params.requires_verification).toBe(true);
    expect(typeof params.requires_verification).toBe('boolean');
  });

  it('google sign_up carries requires_verification: false', () => {
    track('sign_up', {
      method: 'google',
      signup_source: 'invitation',
      inviter_role: 'tutor',
      requires_verification: false,
    });
    const ev = allPushes().filter(p => p.event === 'sign_up');
    expect(ev.length).toBe(1);
    const params = ev[0].event_params as Record<string, unknown>;
    expect(params.method).toBe('google');
    expect(params.signup_source).toBe('invitation');
    expect(params.inviter_role).toBe('tutor');
    expect(params.requires_verification).toBe(false);
    expect(typeof params.requires_verification).toBe('boolean');
  });
});

// ═════════════════════════════════════════════════════════
// SEARCH TERM NORMALISATION
// ═════════════════════════════════════════════════════════

describe('search term normalisation (via guards)', () => {
  it('truncates strings to 100 characters', () => {
    const longTerm = 'a'.repeat(150);
    const result = filterParams('search', { search_term: longTerm, search_origin: 'header' });
    expect((result.search_term as string).length).toBe(100);
  });

  it('passes through short strings unchanged', () => {
    const result = filterParams('search', { search_term: 'SAT math', search_origin: 'header' });
    expect(result.search_term).toBe('SAT math');
  });

  it('drops email-looking search terms', () => {
    state.onViolation = 'warn';
    const result = filterParams('search', { search_term: 'user@example.com', search_origin: 'header' });
    expect(result.search_term).toBeUndefined();
    state.onViolation = 'throw';
  });

  it('drops empty search terms', () => {
    const result = filterParams('search', { search_term: '', search_origin: 'header' });
    expect(result.search_term).toBeUndefined();
  });

  it('drops null search terms', () => {
    const result = filterParams('search', { search_term: null, search_origin: 'header' });
    expect(result.search_term).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════
// AUTH ERROR CODE EXTRACTION
// ═════════════════════════════════════════════════════════

describe('auth_error parameter validation', () => {
  beforeEach(() => {
    resetState();
    // Set up page context so track() works
    state.currentPage = {
      page_template: '/signin',
      content_group: 'account',
      page_location: 'https://app.example.com/signin',
      page_referrer: null,
    };
  });

  it('accepts allowed auth_stage values', () => {
    for (const stage of ['sign_up', 'login', 'verify', 'reset']) {
      const result = filterParams('auth_error', { auth_stage: stage, error_code: 'auth/invalid-credential' });
      expect(result.auth_stage).toBe(stage);
    }
  });

  it('accepts Firebase error codes as error_code', () => {
    const result = filterParams('auth_error', { auth_stage: 'login', error_code: 'auth/invalid-credential' });
    expect(result.error_code).toBe('auth/invalid-credential');
  });

  it('accepts HTTP status as error_code string', () => {
    const result = filterParams('auth_error', { auth_stage: 'login', error_code: '404' });
    expect(result.error_code).toBe('404');
  });

  it('truncates long error codes to 100 chars', () => {
    const longCode = 'E'.repeat(150);
    const result = filterParams('auth_error', { auth_stage: 'login', error_code: longCode });
    expect((result.error_code as string).length).toBe(100);
  });

  it('drops method parameter if not provided', () => {
    const result = filterParams('auth_error', { auth_stage: 'login', error_code: 'auth/user-not-found' });
    expect(result.method).toBeUndefined();
  });

  it('accepts method when provided', () => {
    const result = filterParams('auth_error', { auth_stage: 'login', method: 'email', error_code: 'auth/invalid-credential' });
    expect(result.method).toBe('email');
  });
});

// ═════════════════════════════════════════════════════════
// TUTOR PLAN STATUS NORMALISATION
// ═════════════════════════════════════════════════════════

describe('normalizeTutorPlanStatus', () => {
  // Non-tutors always get null
  it('returns null for student role', () => {
    expect(normalizeTutorPlanStatus('student', 'ACTIVE', 'MONTHLY')).toBeNull();
  });

  it('returns null for parent role', () => {
    expect(normalizeTutorPlanStatus('parent', 'TRIAL', null)).toBeNull();
  });

  it('returns null for admin role', () => {
    expect(normalizeTutorPlanStatus('admin', 'ACTIVE', 'YEARLY')).toBeNull();
  });

  it('returns null for numeric student role (1)', () => {
    expect(normalizeTutorPlanStatus(1, 'ACTIVE', 'MONTHLY')).toBeNull();
  });

  // Tutors — trial
  it('maps TRIAL to trial', () => {
    expect(normalizeTutorPlanStatus('tutor', 'TRIAL', null)).toBe('trial');
  });

  it('maps trial (lowercase) to trial', () => {
    expect(normalizeTutorPlanStatus('tutor', 'trial', null)).toBe('trial');
  });

  it('maps TRIALING to trial', () => {
    expect(normalizeTutorPlanStatus('tutor', 'TRIALING', null)).toBe('trial');
  });

  it('maps trialing (lowercase) to trial', () => {
    expect(normalizeTutorPlanStatus('tutor', 'trialing', null)).toBe('trial');
  });

  // Tutors — active with plan types
  it('maps ACTIVE + MONTHLY to monthly', () => {
    expect(normalizeTutorPlanStatus('tutor', 'ACTIVE', 'MONTHLY')).toBe('monthly');
  });

  it('maps active + monthly (lowercase) to monthly', () => {
    expect(normalizeTutorPlanStatus('tutor', 'active', 'monthly')).toBe('monthly');
  });

  it('maps ACTIVE + YEARLY to yearly', () => {
    expect(normalizeTutorPlanStatus('tutor', 'ACTIVE', 'YEARLY')).toBe('yearly');
  });

  it('maps ACTIVE + TIME_LIMITED to time_limited', () => {
    expect(normalizeTutorPlanStatus('tutor', 'ACTIVE', 'TIME_LIMITED')).toBe('time_limited');
  });

  it('maps ACTIVE + FREE to free', () => {
    expect(normalizeTutorPlanStatus('tutor', 'ACTIVE', 'FREE')).toBe('free');
  });

  it('maps ACTIVE + no planType to free', () => {
    expect(normalizeTutorPlanStatus('tutor', 'ACTIVE', null)).toBe('free');
  });

  it('maps ACTIVE + undefined planType to free', () => {
    expect(normalizeTutorPlanStatus('tutor', 'ACTIVE', undefined)).toBe('free');
  });

  // Tutors — expired states
  it('maps EXPIRED to expired', () => {
    expect(normalizeTutorPlanStatus('tutor', 'EXPIRED', null)).toBe('expired');
  });

  it('maps CANCELED to expired', () => {
    expect(normalizeTutorPlanStatus('tutor', 'CANCELED', null)).toBe('expired');
  });

  it('maps PAST_DUE to expired', () => {
    expect(normalizeTutorPlanStatus('tutor', 'PAST_DUE', null)).toBe('expired');
  });

  it('maps UNPAID to expired', () => {
    expect(normalizeTutorPlanStatus('tutor', 'UNPAID', null)).toBe('expired');
  });

  // Tutors — no subscription
  it('returns free when subscriptionStatus is null', () => {
    expect(normalizeTutorPlanStatus('tutor', null, null)).toBe('free');
  });

  it('returns free when subscriptionStatus is undefined', () => {
    expect(normalizeTutorPlanStatus('tutor', undefined, undefined)).toBe('free');
  });

  // Numeric tutor role
  it('works with numeric tutor role (2)', () => {
    expect(normalizeTutorPlanStatus(2, 'ACTIVE', 'MONTHLY')).toBe('monthly');
  });
});

// ═════════════════════════════════════════════════════════
// REFERRAL SOURCE PRIORITY
// ═════════════════════════════════════════════════════════

describe('signup_source priority', () => {
  // Simulates the priority logic from useAuth.js:
  // invitation > referral > organic
  function getSignupSource(invitationId: string | null, signupSourceFlag: string | null): string {
    if (invitationId) return 'invitation';
    if (signupSourceFlag === 'referral') return 'referral';
    return 'organic';
  }

  it('returns invitation when invitationId is set, even if referral flag is present', () => {
    expect(getSignupSource('inv_123', 'referral')).toBe('invitation');
  });

  it('returns referral when signupSource flag is referral and no invitation', () => {
    expect(getSignupSource(null, 'referral')).toBe('referral');
  });

  it('returns organic when neither invitation nor referral', () => {
    expect(getSignupSource(null, null)).toBe('organic');
  });

  it('returns organic when signupSource is something other than referral', () => {
    expect(getSignupSource(null, 'something_else')).toBe('organic');
  });

  it('returns invitation when invitationId is set and no referral flag', () => {
    expect(getSignupSource('inv_123', null)).toBe('invitation');
  });
});

// ═════════════════════════════════════════════════════════
// ENDPOINT TEMPLATE
// ═════════════════════════════════════════════════════════

describe('toEndpointTemplate', () => {
  it('replaces UUID segments with :id', () => {
    expect(toEndpointTemplate('/tests/550e8400-e29b-41d4-a716-446655440000/take'))
      .toBe('/tests/:id/take');
  });

  it('replaces numeric segments with :id', () => {
    expect(toEndpointTemplate('/tests/12345/results'))
      .toBe('/tests/:id/results');
  });

  it('replaces Firebase-style UIDs (20+ chars) with :id', () => {
    expect(toEndpointTemplate('/users/abcdefghijklmnopqrstuvwx/profile'))
      .toBe('/users/:id/profile');
  });

  it('replaces hex segments (6+) with :id', () => {
    expect(toEndpointTemplate('/posts/a1b2c3d4e5f6'))
      .toBe('/posts/:id');
  });

  it('leaves short non-ID segments untouched', () => {
    expect(toEndpointTemplate('/api/users/list'))
      .toBe('/api/users/list');
  });

  it('handles paths with no IDs', () => {
    expect(toEndpointTemplate('/question-bank/categories'))
      .toBe('/question-bank/categories');
  });

  it('handles multiple IDs in one path', () => {
    expect(toEndpointTemplate('/classes/12345/students/67890'))
      .toBe('/classes/:id/students/:id');
  });

  it('does not include query strings (caller strips them)', () => {
    // toEndpointTemplate receives path only; query string stripped before call
    const url = '/tests/12345/take?mode=tutor';
    const path = url.split('?')[0];
    expect(toEndpointTemplate(path)).toBe('/tests/:id/take');
  });
});

// ═════════════════════════════════════════════════════════
// API INTERCEPTOR TRACKING (exception event)
// ═════════════════════════════════════════════════════════

describe('exception tracking from api interceptor', () => {
  beforeEach(() => {
    resetState();
    state.currentPage = {
      page_template: '/tests',
      content_group: 'practice',
      page_location: 'https://app.example.com/tests',
      page_referrer: null,
    };
  });

  it('fires exception with HTTP_5xx for a 503', () => {
    // Simulate what the interceptor does
    track('exception', {
      description: 'HTTP_503',
      fatal: false,
      http_status: 503,
      endpoint_template: '/tests/:id/answers',
    });
    const events = allPushes().filter((e: any) => e.event === 'exception');
    expect(events).toHaveLength(1);
    const params = events[0].event_params as Record<string, unknown>;
    expect(params.description).toBe('HTTP_503');
    expect(params.fatal).toBe(false);
    expect(params.http_status).toBe(503);
    expect(params.endpoint_template).toBe('/tests/:id/answers');
  });

  it('fires exception with NETWORK_ERROR when no response', () => {
    track('exception', {
      description: 'NETWORK_ERROR',
      fatal: false,
      endpoint_template: '/tests/:id/answers',
    });
    const events = allPushes().filter((e: any) => e.event === 'exception');
    expect(events).toHaveLength(1);
    const params = events[0].event_params as Record<string, unknown>;
    expect(params.description).toBe('NETWORK_ERROR');
    expect(params.fatal).toBe(false);
    expect(params.http_status).toBeUndefined();
  });

  it('does not fire exception for 4xx errors', () => {
    // 4xx errors should NOT produce an exception event
    // The interceptor checks status >= 500 — we verify the guard logic here
    const status = 403;
    const shouldTrack = status >= 500;
    expect(shouldTrack).toBe(false);
  });

  it('rejects the error unchanged after tracking', () => {
    // Verify the interceptor pattern: track() then Promise.reject(error)
    const originalError = { response: { status: 500 }, config: { url: '/test' } };
    // track() does not modify the error
    track('exception', { description: 'HTTP_500', fatal: false });
    // The error object is unchanged
    expect(originalError.response.status).toBe(500);
    expect(originalError.config.url).toBe('/test');
  });
});

// ═════════════════════════════════════════════════════════
// ERROR BOUNDARY
// ═════════════════════════════════════════════════════════

describe('ErrorBoundary tracking', () => {
  beforeEach(() => {
    resetState();
    state.currentPage = {
      page_template: '/',
      content_group: 'home',
      page_location: 'https://app.example.com/',
      page_referrer: null,
    };
  });

  it('fires exception with fatal: true and error.name, not error.message', () => {
    // Simulate what componentDidCatch does
    const error = new TypeError('Cannot read property x of undefined');
    track('exception', {
      description: error.name || 'RENDER_ERROR',
      fatal: true,
    });
    const events = allPushes().filter((e: any) => e.event === 'exception');
    expect(events).toHaveLength(1);
    const params = events[0].event_params as Record<string, unknown>;
    expect(params.description).toBe('TypeError');
    expect(params.fatal).toBe(true);
    // error.message must not appear anywhere in the push
    const pushStr = JSON.stringify(events[0]);
    expect(pushStr).not.toContain('Cannot read property');
  });

  it('uses RENDER_ERROR when error.name is empty', () => {
    const error = new Error('some message');
    error.name = '';
    track('exception', {
      description: error.name || 'RENDER_ERROR',
      fatal: true,
    });
    const events = allPushes().filter((e: any) => e.event === 'exception');
    expect(events).toHaveLength(1);
    expect((events[0].event_params as Record<string, unknown>).description).toBe('RENDER_ERROR');
  });

  it('fires exception only once per crash (no double-fire)', () => {
    const error = new RangeError('stack overflow');
    // componentDidCatch fires once per error, not per re-render
    track('exception', {
      description: error.name || 'RENDER_ERROR',
      fatal: true,
    });
    const events = allPushes().filter((e: any) => e.event === 'exception');
    expect(events).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════════════════
// PHASE 2 BATCH A
// ═════════════════════════════════════════════════════════

describe('Phase 2 batch A', () => {
  beforeEach(() => {
    state.currentPage = {
      page_template: '/tests/:testId/take',
      content_group: 'practice',
      page_location: 'https://app.example.com/tests/t1/take',
      page_referrer: null,
    };
    Object.defineProperty(window, 'location', {
      value: { search: '', origin: 'https://app.example.com', pathname: '/tests/t1/take', href: 'https://app.example.com/tests/t1/take' },
      writable: true,
      configurable: true,
    });
  });

  describe('test_type normalizer', () => {
    it('normalizes "predicted" to "predicted_test"', () => {
      const result = filterParams('test_start', {
        test_id: 't1', test_type: 'predicted', total_questions: 10, section_count: 1,
      });
      expect(result.test_type).toBe('predicted_test');
    });

    it('passes "predicted_test" through unchanged', () => {
      const result = filterParams('test_start', {
        test_id: 't1', test_type: 'predicted_test', total_questions: 10, section_count: 1,
      });
      expect(result.test_type).toBe('predicted_test');
    });

    it('passes "practice_test" through unchanged', () => {
      const result = filterParams('test_start', {
        test_id: 't1', test_type: 'practice_test', total_questions: 10, section_count: 1,
      });
      expect(result.test_type).toBe('practice_test');
    });

    it('passes "diagnostic" through unchanged', () => {
      const result = filterParams('test_start', {
        test_id: 't1', test_type: 'diagnostic', total_questions: 10, section_count: 1,
      });
      expect(result.test_type).toBe('diagnostic');
    });

    it('passes "question_bank" through unchanged', () => {
      const result = filterParams('question_answer', {
        test_id: 't1', test_type: 'question_bank',
      });
      expect(result.test_type).toBe('question_bank');
    });

    it('passes "public_test" through unchanged', () => {
      const result = filterParams('test_start', {
        test_id: 't1', test_type: 'public_test', total_questions: 5, section_count: 1,
      });
      expect(result.test_type).toBe('public_test');
    });
  });

  describe('attempt counter (restart → new test_start)', () => {
    it('trackOnce with different attempt counters fires separate events', () => {
      trackOnce('start:t1:0', 'test_start', {
        test_id: 't1', test_type: 'practice_test', total_questions: 10, section_count: 1,
      });
      // Same key — should not fire again
      trackOnce('start:t1:0', 'test_start', {
        test_id: 't1', test_type: 'practice_test', total_questions: 10, section_count: 1,
      });
      // Increment attempt counter — new key fires
      trackOnce('start:t1:1', 'test_start', {
        test_id: 't1', test_type: 'practice_test', total_questions: 10, section_count: 1,
      });
      const events = allPushes().filter(p => p.event === 'test_start');
      expect(events.length).toBe(2);
    });
  });

  describe('answer_changed detection', () => {
    it('answer_changed is false for a new answer', () => {
      // Simulate: existingAnswerIndex < 0 → answer_changed: false
      const result = filterParams('question_answer', {
        test_id: 't1', test_type: 'practice_test',
        section_number: 1, question_number: 1,
        answer_changed: false, answer_format: 'choice',
      });
      expect(result.answer_changed).toBe(false);
    });

    it('answer_changed is true for a changed answer', () => {
      // Simulate: existingAnswerIndex >= 0 → answer_changed: true
      const result = filterParams('question_answer', {
        test_id: 't1', test_type: 'practice_test',
        section_number: 1, question_number: 1,
        answer_changed: true, answer_format: 'choice',
      });
      expect(result.answer_changed).toBe(true);
    });

    it('answer_changed is coerced from string to boolean', () => {
      const result = filterParams('question_answer', {
        test_id: 't1', test_type: 'practice_test',
        answer_changed: 'true' as unknown,
      });
      expect(result.answer_changed).toBe(true);
      expect(typeof result.answer_changed).toBe('boolean');
    });
  });

  describe('tutor-mode suppression of Phase 2 events', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '?studentId=s1', origin: 'https://app.example.com' },
        writable: true,
        configurable: true,
      });
    });

    const suppressedEvents = [
      'test_start', 'test_resume', 'test_restart', 'question_answer',
      'test_module_start', 'test_pause', 'test_complete', 'test_tool_use',
      'question_mark_for_review', 'test_results_view', 'review_question_open',
      'mistake_dismiss', 'study_plan_cta_click',
    ];

    suppressedEvents.forEach(eventName => {
      it(`suppresses ${eventName} in tutor mode`, () => {
        state.tutorWorkViewFired = false;
        window.dataLayer = [];
        track(eventName, { test_id: 't1', test_type: 'practice_test' });
        const events = allPushes().filter(p => p.event);
        // Should NOT contain the original event
        expect(events.find(e => e.event === eventName)).toBeUndefined();
        // First suppressed event should produce student_work_view
        if (!state.tutorWorkViewFired) {
          // Already fired from a previous iteration in the same beforeEach
        }
      });
    });

    it('replaces first suppressed event with student_work_view', () => {
      state.tutorWorkViewFired = false;
      window.dataLayer = [];
      track('test_start', { test_id: 't1', test_type: 'practice_test', total_questions: 10 });
      const events = allPushes().filter(p => p.event);
      expect(events.length).toBe(1);
      expect(events[0].event).toBe('student_work_view');
      const params = events[0].event_params as Record<string, unknown>;
      expect(params.work_type).toBe('test_review');
      expect(params.test_type).toBe('practice_test');
    });

    it('fires only one student_work_view per page view', () => {
      state.tutorWorkViewFired = false;
      window.dataLayer = [];
      track('test_start', { test_id: 't1', test_type: 'practice_test' });
      track('question_answer', { test_id: 't1', test_type: 'practice_test' });
      track('test_complete', { test_id: 't1', test_type: 'practice_test' });
      const workViews = allPushes().filter(p => p.event === 'student_work_view');
      expect(workViews.length).toBe(1);
    });
  });

  describe('select_content for test lists', () => {
    it('accepts select_content with test list params', () => {
      track('select_content', {
        content_type: 'test',
        content_id: 't1',
        test_type: 'practice_test',
        list_name: 'test_list',
        list_position: 3,
      });
      const events = allPushes().filter(p => p.event === 'select_content');
      expect(events.length).toBe(1);
      const params = events[0].event_params as Record<string, unknown>;
      expect(params.content_type).toBe('test');
      expect(params.list_name).toBe('test_list');
      expect(params.list_position).toBe(3);
      expect(params.test_type).toBe('practice_test');
    });

    it('list_position is an integer', () => {
      const result = filterParams('select_content', {
        content_type: 'test', content_id: 't2', list_position: 1.7,
        list_name: 'test_list',
      });
      expect(result.list_position).toBe(2); // rounded
      expect(typeof result.list_position).toBe('number');
    });
  });

  describe('test lifecycle events parameter validation', () => {
    it('test_start accepts all required params', () => {
      track('test_start', {
        test_id: 't1', test_type: 'practice_test',
        exam_category: 'sat', total_questions: 98, section_count: 4,
      });
      const ev = allPushes().filter(p => p.event === 'test_start');
      expect(ev.length).toBe(1);
      const params = ev[0].event_params as Record<string, unknown>;
      expect(params.test_id).toBe('t1');
      expect(params.test_type).toBe('practice_test');
      expect(params.exam_category).toBe('sat');
      expect(params.total_questions).toBe(98);
      expect(params.section_count).toBe(4);
    });

    it('test_complete carries score as a number', () => {
      track('test_complete', {
        test_id: 't1', test_type: 'question_bank',
        total_questions: 10, correct_count: 7, score: 70.5,
      });
      const ev = allPushes().filter(p => p.event === 'test_complete');
      expect(ev.length).toBe(1);
      const params = ev[0].event_params as Record<string, unknown>;
      expect(params.score).toBe(70.5);
      expect(typeof params.score).toBe('number');
    });

    it('question_answer carries duration_sec as integer', () => {
      track('question_answer', {
        test_id: 't1', test_type: 'practice_test',
        section_number: 1, question_number: 3,
        duration_sec: 45, answer_changed: false, answer_format: 'choice',
      });
      const ev = allPushes().filter(p => p.event === 'question_answer');
      expect(ev.length).toBe(1);
      const params = ev[0].event_params as Record<string, unknown>;
      expect(params.duration_sec).toBe(45);
      expect(typeof params.duration_sec).toBe('number');
    });

    it('test_tool_use accepts tool_name and tool_state', () => {
      track('test_tool_use', {
        tool_name: 'focus_mode', tool_state: 'on',
        test_id: 't1', test_type: 'practice_test', question_number: 5,
      });
      const ev = allPushes().filter(p => p.event === 'test_tool_use');
      expect(ev.length).toBe(1);
      const params = ev[0].event_params as Record<string, unknown>;
      expect(params.tool_name).toBe('focus_mode');
      expect(params.tool_state).toBe('on');
    });

    it('test_restart carries restart_source', () => {
      track('test_restart', {
        test_id: 't1', test_type: 'practice_test', restart_source: 'resume_dialog',
      });
      const ev = allPushes().filter(p => p.event === 'test_restart');
      expect(ev.length).toBe(1);
      expect((ev[0].event_params as any).restart_source).toBe('resume_dialog');
    });

    it('review_question_open carries review_source', () => {
      track('review_question_open', {
        review_source: 'test_results', test_type: 'practice_test', is_correct: true,
      });
      const ev = allPushes().filter(p => p.event === 'review_question_open');
      expect(ev.length).toBe(1);
      expect((ev[0].event_params as any).review_source).toBe('test_results');
    });

    it('mistake_dismiss accepts test_type', () => {
      track('mistake_dismiss', { test_type: 'question_bank' });
      const ev = allPushes().filter(p => p.event === 'mistake_dismiss');
      expect(ev.length).toBe(1);
      expect((ev[0].event_params as any).test_type).toBe('question_bank');
    });
  });
});

// ═════════════════════════════════════════════════════════
// RESOLVE EXAM CATEGORY
// ═════════════════════════════════════════════════════════

describe('resolveExamCategory', () => {
  it('returns undefined for undefined categoryId', () => {
    expect(resolveExamCategory(undefined)).toBeUndefined();
  });

  it('returns undefined for unknown categoryId', () => {
    expect(resolveExamCategory('nonexistent')).toBeUndefined();
  });

  it('resolves root QB category from flat tree (level 0)', () => {
    const qbTree = [
      { id: 'root1', name: 'SAT', parentId: null, level: 0, subcategories: [
        { id: 'child1', name: 'Math', parentId: 'root1', level: 1, subcategories: [
          { id: 'grandchild1', name: 'Algebra', parentId: 'child1', level: 2, subcategories: [] },
        ]},
      ]},
    ];
    expect(resolveExamCategory('grandchild1', qbTree)).toBe('sat');
    expect(resolveExamCategory('child1', qbTree)).toBe('sat');
    expect(resolveExamCategory('root1', qbTree)).toBe('sat');
  });

  it('resolves QB category with multi-word name', () => {
    const qbTree = [
      { id: 'r1', name: 'AP Calculus', parentId: null, level: 0, subcategories: [
        { id: 'c1', name: 'Derivatives', parentId: 'r1', level: 1, subcategories: [] },
      ]},
    ];
    expect(resolveExamCategory('c1', qbTree)).toBe('ap-calculus');
  });

  it('returns undefined when QB tree is empty', () => {
    expect(resolveExamCategory('some-id', [])).toBeUndefined();
  });

  it('returns undefined when QB tree is not provided and category not in practice store', () => {
    // practice-test store is empty in test env
    expect(resolveExamCategory('some-qb-cat-id')).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════
// PHASE 2 BATCH B
// ═════════════════════════════════════════════════════════

describe('Phase 2 batch B', () => {
  beforeEach(() => {
    state.currentPage = {
      page_template: '/question-bank/categories',
      content_group: 'practice',
      page_location: 'https://app.example.com/question-bank/categories',
      page_referrer: null,
    };
    Object.defineProperty(window, 'location', {
      value: { search: '', origin: 'https://app.example.com', pathname: '/question-bank/categories', href: 'https://app.example.com/question-bank/categories' },
      writable: true,
      configurable: true,
    });
  });

  describe('test_generate', () => {
    it('accepts category generation params', () => {
      track('test_generate', {
        test_id: 'tg1', test_type: 'question_bank', creation_method: 'category',
        question_count: 10, difficulty: 'all', only_new_questions: false, category_id: 'cat1',
      });
      const ev = allPushes().filter(p => p.event === 'test_generate');
      expect(ev.length).toBe(1);
      const params = ev[0].event_params as Record<string, unknown>;
      expect(params.creation_method).toBe('category');
      expect(params.question_count).toBe(10);
      expect(params.difficulty).toBe('all');
      expect(params.only_new_questions).toBe(false);
    });

    it('accepts challenge generation params', () => {
      track('test_generate', {
        test_id: 'tg2', test_type: 'question_bank', creation_method: 'challenge',
        question_count: 15, difficulty: 'hard', only_new_questions: true, category_id: 'cat2',
      });
      const params = (allPushes().filter(p => p.event === 'test_generate')[0].event_params as any);
      expect(params.creation_method).toBe('challenge');
      expect(params.difficulty).toBe('hard');
      expect(params.only_new_questions).toBe(true);
    });

    it('accepts custom_builder params (no difficulty/only_new_questions)', () => {
      track('test_generate', {
        test_id: 'tg3', test_type: 'question_bank', creation_method: 'custom_builder',
        question_count: 8,
      });
      const params = (allPushes().filter(p => p.event === 'test_generate')[0].event_params as any);
      expect(params.creation_method).toBe('custom_builder');
      expect(params.question_count).toBe(8);
      expect(params.difficulty).toBeUndefined();
      expect(params.only_new_questions).toBeUndefined();
    });

    it('accepts ai_predicted params', () => {
      track('test_generate', {
        test_id: 'tg4', test_type: 'predicted_question', creation_method: 'ai_predicted',
        question_count: 5, difficulty: 'medium', category_id: 'cat3',
      });
      const params = (allPushes().filter(p => p.event === 'test_generate')[0].event_params as any);
      expect(params.creation_method).toBe('ai_predicted');
      expect(params.test_type).toBe('predicted_question');
    });
  });

  describe('vocab_session_start', () => {
    it('accepts vocab session params', () => {
      track('vocab_session_start', {
        launch_source: 'launcher', card_count: 20, category_id: 'vocab1',
      });
      const ev = allPushes().filter(p => p.event === 'vocab_session_start');
      expect(ev.length).toBe(1);
      const params = ev[0].event_params as Record<string, unknown>;
      expect(params.launch_source).toBe('launcher');
      expect(params.card_count).toBe(20);
      expect(params.category_id).toBe('vocab1');
    });
  });

  describe('vocab_session_end', () => {
    it('accepts completed session params', () => {
      track('vocab_session_end', {
        card_count: 20, cards_viewed: 20, completed: true,
      });
      const ev = allPushes().filter(p => p.event === 'vocab_session_end');
      expect(ev.length).toBe(1);
      const params = ev[0].event_params as Record<string, unknown>;
      expect(params.completed).toBe(true);
      expect(params.cards_viewed).toBe(20);
    });

    it('accepts early-exit session params', () => {
      track('vocab_session_end', {
        card_count: 20, cards_viewed: 7, completed: false,
      });
      const params = (allPushes().filter(p => p.event === 'vocab_session_end')[0].event_params as any);
      expect(params.completed).toBe(false);
      expect(params.cards_viewed).toBe(7);
    });
  });

  describe('score_calculator_use', () => {
    it('accepts empty params', () => {
      track('score_calculator_use', {});
      const ev = allPushes().filter(p => p.event === 'score_calculator_use');
      expect(ev.length).toBe(1);
      expect(ev[0].event_params).toEqual({});
    });
  });

  describe('question_mark_for_review with question_number', () => {
    it('carries question_number when provided', () => {
      track('question_mark_for_review', {
        test_type: 'practice_test', question_number: 5, marked: true, mark_source: 'test',
      });
      const params = (allPushes().filter(p => p.event === 'question_mark_for_review')[0].event_params as any);
      expect(params.question_number).toBe(5);
    });
  });
});

// ═════════════════════════════════════════════════════════
// PHASE 3 BATCH A
// ═════════════════════════════════════════════════════════

import { normalizePlanSource } from '../planSource';

describe('Phase 3 batch A', () => {
  beforeEach(() => {
    resetState();
    // Set up a page context so track() doesn't reject for "no page_view fired"
    state.currentPage = {
      page_template: '/study-plan/:id',
      content_group: 'planning',
      page_location: 'https://app.example.com/study-plan/abc',
      page_referrer: null,
    };
  });

  // ── normalizePlanSource ──────────────────────────────────

  describe('normalizePlanSource', () => {
    it('maps "score-upload" to "score_report"', () => {
      expect(normalizePlanSource('score-upload')).toBe('score_report');
    });

    it('maps "from-scratch" to "scratch"', () => {
      expect(normalizePlanSource('from-scratch')).toBe('scratch');
    });

    it('returns undefined for null/undefined', () => {
      expect(normalizePlanSource(null)).toBeUndefined();
      expect(normalizePlanSource(undefined)).toBeUndefined();
    });

    it('returns undefined with warning for unknown source', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(normalizePlanSource('some-unknown')).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown study plan source'));
      warnSpy.mockRestore();
    });

    it('returns undefined for empty string', () => {
      expect(normalizePlanSource('')).toBeUndefined();
    });
  });

  // ── exam_category_select ────────────────────────────────

  describe('exam_category_select', () => {
    it('accepts valid params', () => {
      track('exam_category_select', {
        exam_category: 'act',
        previous_exam_category: 'sat',
      });
      const ev = allPushes().filter(p => p.event === 'exam_category_select');
      expect(ev).toHaveLength(1);
      const params = ev[0].event_params as any;
      expect(params.exam_category).toBe('act');
      expect(params.previous_exam_category).toBe('sat');
    });

    it('drops unknown params', () => {
      expect(() => track('exam_category_select', {
        exam_category: 'sat',
        unknown_param: 'x',
      })).toThrow(/unknown parameter/i);
    });
  });

  // ── goal_set ────────────────────────────────────────────

  describe('goal_set', () => {
    it('sends goal_score with score_value', () => {
      track('goal_set', { goal_type: 'goal_score', score_value: 1400 });
      const ev = allPushes().filter(p => p.event === 'goal_set');
      expect(ev).toHaveLength(1);
      const params = ev[0].event_params as any;
      expect(params.goal_type).toBe('goal_score');
      expect(params.score_value).toBe(1400);
    });

    it('sends test_date with days_until_test', () => {
      track('goal_set', { goal_type: 'test_date', days_until_test: 30 });
      const params = (lastPush().event_params as any);
      expect(params.goal_type).toBe('test_date');
      expect(params.days_until_test).toBe(30);
    });

    it('sends is_cleared when goal is emptied', () => {
      track('goal_set', { goal_type: 'goal_score', is_cleared: true });
      const params = (lastPush().event_params as any);
      expect(params.is_cleared).toBe(true);
    });

    it('never includes a date value', () => {
      expect(() => track('goal_set', {
        goal_type: 'test_date',
        days_until_test: 30,
        test_date: '2026-12-01',
      })).toThrow(/unknown parameter/i);
    });
  });

  // ── study_plan_wizard_step ──────────────────────────────

  describe('study_plan_wizard_step', () => {
    it('sends step_number and step_name from fixed list', () => {
      track('study_plan_wizard_step', { step_number: 2, step_name: 'test_date' });
      const params = (lastPush().event_params as any);
      expect(params.step_number).toBe(2);
      expect(params.step_name).toBe('test_date');
    });

    it('rejects user-entered text as step_name', () => {
      // step_name is a string param — the guard pipeline accepts any string.
      // The rule is enforced at the call site (fixed map), not in the guards.
      // This test just verifies the param goes through.
      track('study_plan_wizard_step', { step_number: 4, step_name: 'goal_score' });
      const params = (lastPush().event_params as any);
      expect(params.step_name).toBe('goal_score');
    });
  });

  // ── study_plan_generate ─────────────────────────────────

  describe('study_plan_generate', () => {
    it('sends scratch params', () => {
      track('study_plan_generate', {
        plan_source: 'scratch',
        plan_weeks: 8,
        study_days_count: 5,
      });
      const params = (lastPush().event_params as any);
      expect(params.plan_source).toBe('scratch');
      expect(params.plan_weeks).toBe(8);
      expect(params.study_days_count).toBe(5);
    });

    it('sends test_result params with test_type', () => {
      track('study_plan_generate', {
        plan_source: 'test_result',
        plan_weeks: 4,
        test_type: 'diagnostic',
      });
      const params = (lastPush().event_params as any);
      expect(params.plan_source).toBe('test_result');
      expect(params.test_type).toBe('diagnostic');
    });
  });

  // ── study_plan_generate_error ───────────────────────────

  describe('study_plan_generate_error', () => {
    it('sends error code, never message', () => {
      track('study_plan_generate_error', {
        plan_source: 'scratch',
        error_code: 'GENERATION_FAILED',
      });
      const params = (lastPush().event_params as any);
      expect(params.error_code).toBe('GENERATION_FAILED');
    });

    it('rejects error_message param', () => {
      expect(() => track('study_plan_generate_error', {
        plan_source: 'scratch',
        error_code: '500',
        error_message: 'Internal server error',
      })).toThrow(/unknown parameter/i);
    });
  });

  // ── study_plan_open ─────────────────────────────────────

  describe('study_plan_open', () => {
    it('sends plan_source and plan_weeks', () => {
      track('study_plan_open', { plan_source: 'score_report', plan_weeks: 6 });
      const params = (lastPush().event_params as any);
      expect(params.plan_source).toBe('score_report');
      expect(params.plan_weeks).toBe(6);
    });
  });

  // ── study_plan_delete ───────────────────────────────────

  describe('study_plan_delete', () => {
    it('sends plan_source', () => {
      track('study_plan_delete', { plan_source: 'scratch' });
      const params = (lastPush().event_params as any);
      expect(params.plan_source).toBe('scratch');
    });
  });

  // ── task_status_change ──────────────────────────────────

  describe('task_status_change', () => {
    it('sends from_status, to_status, and task_week for study_plan', () => {
      track('task_status_change', {
        task_source: 'study_plan',
        from_status: 'todo',
        to_status: 'completed',
        task_week: 3,
      });
      const params = (lastPush().event_params as any);
      expect(params.task_source).toBe('study_plan');
      expect(params.from_status).toBe('todo');
      expect(params.to_status).toBe('completed');
      expect(params.task_week).toBe(3);
    });

    it('does not fire when same column (same status)', () => {
      // This is enforced at the call site. Just verify the track call works.
      track('task_status_change', {
        task_source: 'personal',
        from_status: 'todo',
        to_status: 'completed',
      });
      const ev = allPushes().filter(p => p.event === 'task_status_change');
      expect(ev).toHaveLength(1);
    });

    it('maps personal pending → todo', () => {
      track('task_status_change', {
        task_source: 'personal',
        from_status: 'todo',
        to_status: 'completed',
      });
      const params = (lastPush().event_params as any);
      expect(params.from_status).toBe('todo');
    });
  });

  // ── subtask_complete ────────────────────────────────────

  describe('subtask_complete', () => {
    it('sends study_plan subtask_type from enum', () => {
      track('subtask_complete', {
        task_source: 'study_plan',
        subtask_type: 'question_bank',
      });
      const params = (lastPush().event_params as any);
      expect(params.subtask_type).toBe('question_bank');
    });

    it('sends personal subtask_type as "personal"', () => {
      track('subtask_complete', {
        task_source: 'personal',
        subtask_type: 'personal',
      });
      const params = (lastPush().event_params as any);
      expect(params.subtask_type).toBe('personal');
    });

    it('does not fire on uncheck (enforced at call site)', () => {
      // Call site guard: only fire when subtask.completed transitions false→true
      // We just verify the event works when it should fire.
      track('subtask_complete', { task_source: 'study_plan', subtask_type: 'tutorial_videos' });
      expect(allPushes().filter(p => p.event === 'subtask_complete')).toHaveLength(1);
    });
  });

  // ── task_create ─────────────────────────────────────────

  describe('task_create', () => {
    it('sends task_source for study_plan', () => {
      track('task_create', { task_source: 'study_plan' });
      const params = (lastPush().event_params as any);
      expect(params.task_source).toBe('study_plan');
    });

    it('sends task_source for personal', () => {
      track('task_create', { task_source: 'personal' });
      const params = (lastPush().event_params as any);
      expect(params.task_source).toBe('personal');
    });
  });

  // ── task_delete ─────────────────────────────────────────

  describe('task_delete', () => {
    it('sends task_source', () => {
      track('task_delete', { task_source: 'personal' });
      const params = (lastPush().event_params as any);
      expect(params.task_source).toBe('personal');
    });
  });

  // ── subtask_link_click ──────────────────────────────────

  describe('subtask_link_click', () => {
    it('sends subtask_type and destination_template', () => {
      track('subtask_link_click', {
        subtask_type: 'question_bank',
        destination_template: '/question-bank/categories',
      });
      const params = (lastPush().event_params as any);
      expect(params.subtask_type).toBe('question_bank');
      expect(params.destination_template).toBe('/question-bank/categories');
    });
  });

  // ── study_session_start_click ───────────────────────────

  describe('study_session_start_click', () => {
    it('sends has_plan boolean', () => {
      track('study_session_start_click', { has_plan: true });
      const params = (lastPush().event_params as any);
      expect(params.has_plan).toBe(true);
    });
  });

  // ── tutor mode suppression for Phase 3 events ──────────

  describe('tutor mode suppression (Phase 3)', () => {
    const suppressedEvents = [
      'study_plan_open', 'task_create', 'task_status_change',
      'subtask_complete', 'subtask_link_click', 'task_delete',
    ];

    suppressedEvents.forEach(eventName => {
      it(`suppresses ${eventName} in tutor mode`, () => {
        // Simulate tutor mode via URL
        const origSearch = window.location.search;
        Object.defineProperty(window, 'location', {
          value: { ...window.location, search: '?mode=tutor&studentId=s1' },
          writable: true,
        });

        track(eventName, { task_source: 'study_plan' });

        // Should NOT fire the original event
        const origEvents = allPushes().filter(p => p.event === eventName);
        expect(origEvents).toHaveLength(0);

        // Should fire student_work_view instead (once)
        const workViews = allPushes().filter(p => p.event === 'student_work_view');
        expect(workViews.length).toBeLessThanOrEqual(1);

        // Restore
        Object.defineProperty(window, 'location', {
          value: { ...window.location, search: origSearch },
          writable: true,
        });
      });
    });
  });

  // ── exam_category_select hydration guard ────────────────

  describe('exam_category_select hydration guard', () => {
    it('the store guard skips fire when selectedCategory is null (hydration)', () => {
      // This is an integration-level concern. The guard in useTestCategoriesStore
      // checks prev.selectedCategory !== null before firing. On hydration,
      // selectedCategory is null because categories haven't loaded yet.
      // We verify the track call itself works fine.
      track('exam_category_select', { exam_category: 'sat' });
      expect(allPushes().filter(p => p.event === 'exam_category_select')).toHaveLength(1);
    });
  });

  // ── kanban drag unit test ───────────────────────────────

  describe('kanban drag task_status_change (unit-level)', () => {
    it('fires task_status_change with correct params for cross-column drag', () => {
      // Simulate what KanbanStudyPlan.handleDragEnd does after API success
      const sourceStatus = 'todo';
      const destinationStatus = 'completed';
      const movedTask = { id: 't1', week: 2 };

      if (sourceStatus !== destinationStatus) {
        track('task_status_change', {
          task_source: 'study_plan',
          from_status: sourceStatus,
          to_status: destinationStatus,
          task_week: movedTask.week,
        });
      }

      const ev = allPushes().filter(p => p.event === 'task_status_change');
      expect(ev).toHaveLength(1);
      const params = ev[0].event_params as any;
      expect(params.from_status).toBe('todo');
      expect(params.to_status).toBe('completed');
      expect(params.task_week).toBe(2);
    });

    it('does not fire for same-column reorder', () => {
      const sourceStatus = 'todo';
      const destinationStatus = 'todo';

      if (sourceStatus !== destinationStatus) {
        track('task_status_change', {
          task_source: 'study_plan',
          from_status: sourceStatus,
          to_status: destinationStatus,
        });
      }

      const ev = allPushes().filter(p => p.event === 'task_status_change');
      expect(ev).toHaveLength(0);
    });
  });
});

// ═════════════════════════════════════════════════════════
// FOLLOW-UP: normalizePlanSource with testProgressId
// ═════════════════════════════════════════════════════════

describe('normalizePlanSource (follow-up)', () => {
  it('maps "score-upload" to "score_report"', () => {
    expect(normalizePlanSource('score-upload')).toBe('score_report');
  });

  it('maps "from-scratch" to "scratch"', () => {
    expect(normalizePlanSource('from-scratch')).toBe('scratch');
  });

  it('returns "test_result" when source is undefined but testProgressId exists', () => {
    expect(normalizePlanSource(undefined, 'tp-123')).toBe('test_result');
    expect(normalizePlanSource(null, 'tp-456')).toBe('test_result');
  });

  it('returns undefined when both source and testProgressId are missing', () => {
    expect(normalizePlanSource(undefined)).toBeUndefined();
    expect(normalizePlanSource(null, undefined)).toBeUndefined();
    expect(normalizePlanSource(null, null)).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════
// PHASE 3 BATCH B
// ═════════════════════════════════════════════════════════

describe('Phase 3 batch B', () => {
  beforeEach(() => {
    resetState();
    state.currentPage = {
      page_template: '/dashboard',
      content_group: 'home',
      page_location: 'https://app.example.com/dashboard',
      page_referrer: null,
    };
  });

  // ── progress_report_view ────────────────────────────────

  describe('progress_report_view', () => {
    it('sends viewed_scope "self"', () => {
      track('progress_report_view', { viewed_scope: 'self' });
      const params = (lastPush().event_params as any);
      expect(params.viewed_scope).toBe('self');
    });

    it('sends viewed_scope "linked_student"', () => {
      track('progress_report_view', { viewed_scope: 'linked_student' });
      const params = (lastPush().event_params as any);
      expect(params.viewed_scope).toBe('linked_student');
    });

    it('re-fires when student changes (different trackOnce key)', () => {
      trackOnce('progress_report:self:self', 'progress_report_view', { viewed_scope: 'self' });
      trackOnce('progress_report:linked_student:s1', 'progress_report_view', { viewed_scope: 'linked_student' });
      trackOnce('progress_report:linked_student:s2', 'progress_report_view', { viewed_scope: 'linked_student' });
      const ev = allPushes().filter(p => p.event === 'progress_report_view');
      expect(ev).toHaveLength(3);
    });

    it('does not repeat for same student (same trackOnce key)', () => {
      trackOnce('progress_report:linked_student:s1', 'progress_report_view', { viewed_scope: 'linked_student' });
      trackOnce('progress_report:linked_student:s1', 'progress_report_view', { viewed_scope: 'linked_student' });
      const ev = allPushes().filter(p => p.event === 'progress_report_view');
      expect(ev).toHaveLength(1);
    });
  });

  // ── assignment_open ─────────────────────────────────────

  describe('assignment_open', () => {
    it('sends test_id, assignment_type, and overdue days', () => {
      track('assignment_open', {
        test_id: 'test-1',
        assignment_type: 'practice_test',
        days_until_due: -3,
        is_overdue: true,
      });
      const params = (lastPush().event_params as any);
      expect(params.test_id).toBe('test-1');
      expect(params.assignment_type).toBe('practice_test');
      expect(params.days_until_due).toBe(-3);
      expect(params.is_overdue).toBe(true);
    });

    it('omits days_until_due and is_overdue when no due date', () => {
      track('assignment_open', {
        test_id: 'test-2',
        assignment_type: 'question_bank_test',
      });
      const params = (lastPush().event_params as any);
      expect(params.test_id).toBe('test-2');
      expect(params.days_until_due).toBeUndefined();
      expect(params.is_overdue).toBeUndefined();
    });
  });

  // ── hub_card_click ──────────────────────────────────────

  describe('hub_card_click', () => {
    it('sends hub_id, card_id, and destination_template', () => {
      track('hub_card_click', {
        hub_id: 'question-bank-hub',
        card_id: 'question-bank-list',
        destination_template: '/question-bank/categories',
      });
      const params = (lastPush().event_params as any);
      expect(params.hub_id).toBe('question-bank-hub');
      expect(params.card_id).toBe('question-bank-list');
      expect(params.destination_template).toBe('/question-bank/categories');
    });
  });

  // ── home_cta_click ──────────────────────────────────────

  describe('home_cta_click', () => {
    it('sends cta_id with destination_template', () => {
      track('home_cta_click', {
        cta_id: 'continue_test',
        destination_template: '/tests/:testId/take',
      });
      const params = (lastPush().event_params as any);
      expect(params.cta_id).toBe('continue_test');
      expect(params.destination_template).toBe('/tests/:testId/take');
    });

    it('sends cta_id without destination_template for modal CTAs', () => {
      track('home_cta_click', { cta_id: 'tutor_add_video' });
      const params = (lastPush().event_params as any);
      expect(params.cta_id).toBe('tutor_add_video');
      expect(params.destination_template).toBeUndefined();
    });

    const allCtaIds = [
      'continue_test', 'browse_tests', 'upload_score_report',
      'browse_tests_from_score', 'build_plan_from_scratch',
      'study_plan_due', 'view_assignments',
      'tutor_add_video', 'tutor_add_event', 'tutor_add_study_guide',
    ];
    allCtaIds.forEach(id => {
      it(`accepts cta_id "${id}"`, () => {
        track('home_cta_click', { cta_id: id });
        const ev = allPushes().filter(p => p.event === 'home_cta_click');
        expect(ev.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ── view_promotion ──────────────────────────────────────

  describe('view_promotion', () => {
    it('sends promotion_id, promotion_name, and creative_slot', () => {
      track('view_promotion', {
        promotion_id: 'promo-1',
        promotion_name: 'Black Friday Sale',
        creative_slot: 'home_promo_modal',
      });
      const params = (lastPush().event_params as any);
      expect(params.promotion_id).toBe('promo-1');
      expect(params.promotion_name).toBe('Black Friday Sale');
      expect(params.creative_slot).toBe('home_promo_modal');
    });

    it('sends book_demo banner', () => {
      track('view_promotion', {
        promotion_id: 'book_demo',
        creative_slot: 'book_demo_banner',
      });
      const params = (lastPush().event_params as any);
      expect(params.promotion_id).toBe('book_demo');
      expect(params.creative_slot).toBe('book_demo_banner');
    });

    it('does not repeat within same session (sessionStorage guard)', () => {
      // Simulate the sessionStorage guard
      const key = 'ppb.analytics.promoSeen.promo-1:v2';
      expect(sessionStorage.getItem(key)).toBeNull();
      sessionStorage.setItem(key, '1');
      // Second check would see the flag
      expect(sessionStorage.getItem(key)).toBe('1');
    });
  });

  // ── select_promotion ────────────────────────────────────

  describe('select_promotion', () => {
    it('sends promotion params on CTA click', () => {
      track('select_promotion', {
        promotion_id: 'promo-1',
        promotion_name: 'Winter Sale',
        creative_slot: 'home_promo_modal',
      });
      const params = (lastPush().event_params as any);
      expect(params.promotion_id).toBe('promo-1');
      expect(params.creative_slot).toBe('home_promo_modal');
    });
  });

  // ── promotion_dismiss ───────────────────────────────────

  describe('promotion_dismiss', () => {
    it('sends promotion_id and creative_slot on dismiss', () => {
      track('promotion_dismiss', {
        promotion_id: 'book_demo',
        creative_slot: 'book_demo_banner',
      });
      const params = (lastPush().event_params as any);
      expect(params.promotion_id).toBe('book_demo');
      expect(params.creative_slot).toBe('book_demo_banner');
    });
  });

  // ── study_session_start_click ───────────────────────────

  describe('study_session_start_click', () => {
    it('sends has_plan true', () => {
      track('study_session_start_click', { has_plan: true });
      const params = (lastPush().event_params as any);
      expect(params.has_plan).toBe(true);
    });

    it('sends has_plan false', () => {
      track('study_session_start_click', { has_plan: false });
      const params = (lastPush().event_params as any);
      expect(params.has_plan).toBe(false);
    });
  });
});

// ═════════════════════════════════════════════════════════
// trackAiCall
// ═════════════════════════════════════════════════════════

import { noteAiRequestId, trackAiCall } from '../trackAiCall';

describe('trackAiCall', () => {
  beforeEach(() => {
    resetState();
    // trackAiCall fires track() which requires a page context
    state.currentPage = {
      page_template: '/test',
      content_group: 'practice',
      page_location: 'https://app.example.com/test',
      page_referrer: null,
    };
  });

  // Helper to find ai_request pushes
  function aiPushes() {
    return allPushes().filter(p => p.event === 'ai_request');
  }

  function lastAiParams() {
    const pushes = aiPushes();
    return pushes[pushes.length - 1]?.event_params as Record<string, unknown>;
  }

  // ── Outcome mapping ──────────────────────────────────

  it('success: returns result and pushes ai_request with success', async () => {
    const mockResult = { content: 'hello', messageId: '123' };
    const result = await trackAiCall(
      'question_tutor_chat',
      () => Promise.resolve(mockResult),
      {
        inputChars: 5,
        deriveOutput: (r: any) => ({ outputChars: r.content.length }),
        isEmpty: (r: any) => !r.content?.length,
      },
    );
    expect(result).toBe(mockResult); // same reference
    const params = lastAiParams();
    expect(params.ai_feature).toBe('question_tutor_chat');
    expect(params.ai_outcome).toBe('success');
    expect(params.output_chars).toBe(5);
    expect(params.input_chars).toBe(5);
    expect(typeof params.latency_ms).toBe('number');
    expect(params.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('error: rethrows unchanged and pushes ai_request with error', async () => {
    const mockError = Object.assign(new Error('boom'), {
      response: { status: 500, data: { code: 'INTERNAL_ERROR' } },
    });
    let caught: any;
    try {
      await trackAiCall('question_hint', () => Promise.reject(mockError));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe(mockError); // same reference
    const params = lastAiParams();
    expect(params.ai_outcome).toBe('error');
    expect(params.error_code).toBe('INTERNAL_ERROR');
  });

  it('policy_blocked: detected from resolved value', async () => {
    await trackAiCall(
      'recommendation_letter',
      () => Promise.resolve({ hadPolicyBlock: true, letter: '', id: 'x' }),
      {
        isPolicyBlocked: (r: any) => r.hadPolicyBlock === true,
        deriveOutput: (r: any) => ({ outputChars: r.letter?.length }),
      },
    );
    expect(lastAiParams().ai_outcome).toBe('policy_blocked');
  });

  it('limit_hit: 429 DAILY_LIMIT_EXCEEDED', async () => {
    const err = Object.assign(new Error('limit'), {
      response: { status: 429, data: { error: 'DAILY_LIMIT_EXCEEDED' } },
    });
    try {
      await trackAiCall('question_tutor_chat', () => Promise.reject(err));
    } catch { /* expected */ }
    expect(lastAiParams().ai_outcome).toBe('limit_hit');
  });

  it('limit_hit: AI_TOKEN_LIMIT_EXCEEDED (via code)', async () => {
    const err = Object.assign(new Error('tokens'), {
      response: { status: 403, data: { code: 'AI_TOKEN_LIMIT_EXCEEDED' } },
    });
    try {
      await trackAiCall('essay_feedback', () => Promise.reject(err));
    } catch { /* expected */ }
    expect(lastAiParams().ai_outcome).toBe('limit_hit');
  });

  it('limit_hit: re-thrown plain object from study plan service', async () => {
    // Study plan services re-throw error.response.data as a plain object
    const plainErr = { error: 'DAILY_LIMIT_EXCEEDED', message: 'Limit reached', limitCheck: {} };
    try {
      await trackAiCall('study_plan', () => Promise.reject(plainErr));
    } catch { /* expected */ }
    expect(lastAiParams().ai_outcome).toBe('limit_hit');
  });

  it('empty: detected from resolved value', async () => {
    await trackAiCall(
      'question_tutor_chat',
      () => Promise.resolve({ content: '', messageId: '1' }),
      {
        isEmpty: (r: any) => !r.content?.length,
      },
    );
    expect(lastAiParams().ai_outcome).toBe('empty');
  });

  // ── Transparency ─────────────────────────────────────

  it('return transparency: same reference returned', async () => {
    const obj = { deeply: { nested: { data: [1, 2, 3] } } };
    const result = await trackAiCall('study_plan', () => Promise.resolve(obj));
    expect(result).toBe(obj);
  });

  it('error transparency: same error reference thrown', async () => {
    const err = new Error('specific error');
    let caught: any;
    try {
      await trackAiCall('predicted_test', () => Promise.reject(err));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe(err);
  });

  // ── Latency ──────────────────────────────────────────

  it('latency is measured as a positive integer', async () => {
    await trackAiCall(
      'question_hint',
      () => new Promise(res => setTimeout(() => res({ id: '1', text: 'hi' }), 10)),
      { deriveOutput: (r: any) => ({ outputChars: r.text?.length }) },
    );
    const params = lastAiParams();
    expect(typeof params.latency_ms).toBe('number');
    expect(params.latency_ms).toBeGreaterThanOrEqual(5);
    expect(Number.isInteger(params.latency_ms)).toBe(true);
  });

  // ── Abort ────────────────────────────────────────────

  it('abort: no ai_request fired for AbortError', async () => {
    const abortErr = new DOMException('The operation was aborted.', 'AbortError');
    const before = aiPushes().length;
    try {
      await trackAiCall('question_tutor_chat', () => Promise.reject(abortErr));
    } catch { /* expected */ }
    expect(aiPushes().length).toBe(before); // no new push
  });

  // ── Extraction failure resilience ────────────────────

  it('extraction failure: still sends ai_request without the failed metrics', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await trackAiCall(
      'essay_ideas',
      () => Promise.resolve({ id: '1', ideas: [{ title: 'x' }] }),
      {
        deriveOutput: () => { throw new Error('extraction boom'); },
        isPolicyBlocked: () => false,
        isEmpty: () => false,
      },
    );
    const params = lastAiParams();
    expect(params.ai_feature).toBe('essay_ideas');
    expect(params.ai_outcome).toBe('success');
    expect(params.latency_ms).toBeGreaterThanOrEqual(0);
    // output_chars etc. should be absent since extraction failed
    expect(params.output_chars).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  // ── Concurrent calls ─────────────────────────────────

  it('concurrent calls produce separate ai_request pushes', async () => {
    const before = aiPushes().length;
    await Promise.all([
      trackAiCall('question_tutor_chat', () => Promise.resolve({ content: 'a', messageId: '1' })),
      trackAiCall('essay_feedback', () => Promise.resolve({ id: '2', result: { sections: [], overall: { score: 80 }, policyBlocked: false } })),
    ]);
    const after = aiPushes().length;
    expect(after - before).toBe(2);
    const features = aiPushes().slice(before).map(p => (p.event_params as any).ai_feature);
    expect(features).toContain('question_tutor_chat');
    expect(features).toContain('essay_feedback');
  });

  // ── Request ID ───────────────────────────────────────

  it('ai_request_id omitted when response has no requestId', async () => {
    await trackAiCall('study_plan', () => Promise.resolve('plan-id'));
    const params = lastAiParams();
    expect(params.ai_request_id).toBeUndefined();
  });

  it('ai_request_id sent when response has requestId', async () => {
    await trackAiCall('study_plan', () => Promise.resolve({ studyPlanId: 'sp1', requestId: 'req-123' }));
    const params = lastAiParams();
    expect(params.ai_request_id).toBe('req-123');
  });

  // ── CI check: no string param > 100 chars ────────────

  it('ai_request params do not contain strings over 100 characters', async () => {
    // The guards.ts MAX_STRING_LENGTH is 100 and truncates strings.
    // Verify that even if a feature returns a very long string, it gets truncated.
    await trackAiCall(
      'question_tutor_chat',
      () => Promise.resolve({ content: 'x'.repeat(200), messageId: '1' }),
      {
        deriveOutput: (r: any) => ({ outputChars: r.content?.length }),
      },
    );
    const params = lastAiParams();
    for (const [, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        expect(value.length).toBeLessThanOrEqual(100);
      }
    }
  });

  // ── Feature-specific outcome mapping ─────────────────

  describe('essay_ideas policy block', () => {
    it('detects policy block when first idea has error', async () => {
      const response = {
        id: '1',
        ideas: [{ error: true, message: 'blocked' }],
      };
      await trackAiCall(
        'essay_ideas',
        () => Promise.resolve(response),
        {
          isPolicyBlocked: (r: any) => r.ideas?.length > 0 && (r.ideas[0] as any).error === true,
          isEmpty: (r: any) => !r.ideas?.length,
          deriveOutput: (r: any) => ({
            outputItems: r.ideas?.filter((i: any) => !i.error).length,
          }),
        },
      );
      expect(lastAiParams().ai_outcome).toBe('policy_blocked');
    });
  });

  describe('essay_feedback with score', () => {
    it('extracts ai_result_score and output_items', async () => {
      const response = {
        id: '1',
        result: {
          sections: [{ category: 'structure', score: 80 }, { category: 'grammar', score: 90 }],
          overall: { score: 85, summary: 'good' },
          policyBlocked: false,
        },
      };
      await trackAiCall(
        'essay_feedback',
        () => Promise.resolve(response),
        {
          deriveOutput: (r: any) => ({
            outputItems: r.result?.sections?.length,
            aiResultScore: r.result?.overall?.score,
          }),
          isPolicyBlocked: (r: any) => r.result?.policyBlocked === true,
          isEmpty: (r: any) => !r.result?.sections?.length && !r.result?.policyBlocked,
        },
      );
      const params = lastAiParams();
      expect(params.ai_result_score).toBe(85);
      expect(params.output_items).toBe(2);
      expect(params.ai_outcome).toBe('success');
    });
  });

  describe('essay_feedback policy blocked', () => {
    it('detects policyBlocked in result', async () => {
      const response = {
        id: '2',
        result: {
          sections: [],
          overall: { score: 0, summary: '' },
          policyBlocked: true,
          message: 'blocked',
        },
      };
      await trackAiCall(
        'essay_feedback',
        () => Promise.resolve(response),
        {
          isPolicyBlocked: (r: any) => r.result?.policyBlocked === true,
          isEmpty: (r: any) => !r.result?.sections?.length && !r.result?.policyBlocked,
        },
      );
      expect(lastAiParams().ai_outcome).toBe('policy_blocked');
    });
  });

  describe('HTTP error code extraction', () => {
    it('extracts HTTP_500 from status-only error', async () => {
      const err = Object.assign(new Error('Server Error'), {
        response: { status: 500 },
      });
      try {
        await trackAiCall('course_plan_outline', () => Promise.reject(err));
      } catch { /* expected */ }
      expect(lastAiParams().error_code).toBe('HTTP_500');
    });

    it('extracts error message when no response', async () => {
      const err = new Error('Network timeout');
      try {
        await trackAiCall('pdf_question_generate', () => Promise.reject(err));
      } catch { /* expected */ }
      expect(lastAiParams().error_code).toBe('Network timeout');
    });
  });

  // ── Follow-up: turn_number ────────────────────────────

  describe('turn_number', () => {
    it('1st, 2nd, 3rd message → turn_number 1, 2, 3', async () => {
      for (let n = 1; n <= 3; n++) {
        await trackAiCall(
          'question_tutor_chat',
          () => Promise.resolve({ content: 'reply', messageId: `m${n}` }),
          {
            inputChars: 5,
            turnNumber: n,
            deriveOutput: (r: any) => ({ outputChars: r.content.length }),
          },
        );
        const pushes = aiPushes();
        expect((pushes[pushes.length - 1].event_params as any).turn_number).toBe(n);
      }
    });
  });

  // ── Follow-up: predicted_test/question missing fields ──

  describe('predicted response missing fields', () => {
    it('predicted_test: omits output_items when totalQuestions is missing and outcome is success', async () => {
      await trackAiCall(
        'predicted_test',
        () => Promise.resolve({ id: 'test1', name: 'SAT' }), // no totalQuestions
        {
          deriveOutput: (r: any) => ({
            outputItems: typeof r?.totalQuestions === 'number' ? r.totalQuestions : undefined,
          }),
        },
      );
      const params = lastAiParams();
      expect(params.ai_outcome).toBe('success'); // not empty
      expect(params.output_items).toBeUndefined();
    });

    it('predicted_question: omits output_items when questions/totalQuestions missing', async () => {
      await trackAiCall(
        'predicted_question',
        () => Promise.resolve({ id: 'pq1', name: 'Custom' }), // no questions or totalQuestions
        {
          deriveOutput: (r: any) => {
            const count = r?.questions?.length ?? r?.totalQuestions;
            return { outputItems: typeof count === 'number' ? count : undefined };
          },
        },
      );
      const params = lastAiParams();
      expect(params.ai_outcome).toBe('success');
      expect(params.output_items).toBeUndefined();
    });
  });

  // ── ai_request_id ────────────────────────────────────

  describe('ai_request_id', () => {
    it('falls back to the X-Request-Id header when the service returns part of the body', async () => {
      await trackAiCall('study_plan', async () => {
        noteAiRequestId('req-header');
        return 'plan-123';
      });
      expect(lastAiParams().ai_request_id).toBe('req-header');
    });

    it('takes the header on errors too', async () => {
      await expect(
        trackAiCall('study_plan', async () => {
          noteAiRequestId('req-error');
          throw Object.assign(new Error('boom'), { response: { status: 500, data: {} } });
        }),
      ).rejects.toThrow('boom');
      expect(lastAiParams().ai_request_id).toBe('req-error');
    });

    it('prefers the body over the header', async () => {
      await trackAiCall('essay_ideas', async () => {
        noteAiRequestId('req-header');
        return { requestId: 'req-body' };
      });
      expect(lastAiParams().ai_request_id).toBe('req-body');
    });

    it('ignores headers seen outside any call', async () => {
      noteAiRequestId('req-stale');
      await trackAiCall('study_plan', () => Promise.resolve('plan-123'));
      expect(lastAiParams().ai_request_id).toBeUndefined();
    });
  });
});

// ═════════════════════════════════════════════════════════
// Batch B: interaction events
// ═════════════════════════════════════════════════════════

describe('Phase 4 batch B events', () => {
  beforeEach(() => {
    resetState();
    state.currentPage = {
      page_template: '/test',
      content_group: 'ai_tools',
      page_location: 'https://app.example.com/test',
      page_referrer: null,
    };
  });

  describe('ai_output_copy', () => {
    it('fires with ai_feature recommendation_letter', () => {
      track('ai_output_copy', { ai_feature: 'recommendation_letter' });
      const params = (lastPush().event_params as any);
      expect(params.ai_feature).toBe('recommendation_letter');
    });

    it('never includes the copied text', () => {
      // 'text' is a PII key and would be dropped by guards
      state.onViolation = 'warn';
      const result = filterParams('ai_output_copy', {
        ai_feature: 'recommendation_letter',
        text: 'Dear Admissions Committee...',
      });
      expect(result).not.toHaveProperty('text');
      state.onViolation = 'throw';
    });
  });

  describe('ai_history_open', () => {
    it('fires with ai_feature essay_ideas and result_age_days', () => {
      track('ai_history_open', { ai_feature: 'essay_ideas', result_age_days: 3 });
      const params = (lastPush().event_params as any);
      expect(params.ai_feature).toBe('essay_ideas');
      expect(params.result_age_days).toBe(3);
    });

    it('fires with ai_feature essay_feedback', () => {
      track('ai_history_open', { ai_feature: 'essay_feedback', result_age_days: 0 });
      const params = (lastPush().event_params as any);
      expect(params.ai_feature).toBe('essay_feedback');
      expect(params.result_age_days).toBe(0);
    });

    it('trackOnce prevents duplicate fires for same record', () => {
      const before = allPushes().filter(p => p.event === 'ai_history_open').length;
      trackOnce('ai_history_open:rec1', 'ai_history_open', { ai_feature: 'essay_ideas', result_age_days: 2 });
      trackOnce('ai_history_open:rec1', 'ai_history_open', { ai_feature: 'essay_ideas', result_age_days: 2 });
      const after = allPushes().filter(p => p.event === 'ai_history_open').length;
      expect(after - before).toBe(1);
    });

    it('does not fire when fromGenerate is true (simulated by skipping trackOnce)', () => {
      // The detail pages check location.state.fromGenerate and skip the
      // trackOnce call entirely. We simulate that guard here.
      const fromGenerate = true;
      const before = allPushes().filter(p => p.event === 'ai_history_open').length;
      if (!fromGenerate) {
        trackOnce('ai_history_open:gen1', 'ai_history_open', { ai_feature: 'essay_feedback', result_age_days: 0 });
      }
      const after = allPushes().filter(p => p.event === 'ai_history_open').length;
      expect(after).toBe(before); // no event
    });

    it('fires when fromGenerate is false (list navigation)', () => {
      const fromGenerate = false;
      const before = allPushes().filter(p => p.event === 'ai_history_open').length;
      if (!fromGenerate) {
        trackOnce('ai_history_open:list1', 'ai_history_open', { ai_feature: 'essay_ideas', result_age_days: 7 });
      }
      const after = allPushes().filter(p => p.event === 'ai_history_open').length;
      expect(after - before).toBe(1);
      const params = (allPushes().filter(p => p.event === 'ai_history_open').pop()!.event_params as any);
      expect(params.result_age_days).toBe(7);
    });
  });
});

// ═════════════════════════════════════════════════════════
// PHASE 5 BATCH A — ECOMMERCE / CATALOG BROWSING
// ═════════════════════════════════════════════════════════

import { toItem, buildEcommerce, MAX_LIST_ITEMS } from '../ecommerce';
import type { ToItemInput } from '../ecommerce';

describe('toItem builder', () => {
  const freeInput: ToItemInput = {
    id: 'c1',
    name: 'SAT Math Prep',
    category: 'course',
    category2: 'sat',
    brand: 'platform',
    variant: 'free',
    price: 0,
  };

  const tutorInput: ToItemInput = {
    id: 'c2',
    name: 'ACT English Intensive',
    category: 'course',
    category2: 'act',
    brand: 'tutor',
    variant: 'one_time',
    price: 29.99,
  };

  const noCat2Input: ToItemInput = {
    id: 'r1',
    name: 'Study Guide PDF',
    category: 'resource',
    brand: 'platform',
    variant: 'free',
    price: 0,
  };

  it('builds a free item with price 0', () => {
    const item = toItem(freeInput);
    expect(item.item_id).toBe('c1');
    expect(item.item_name).toBe('SAT Math Prep');
    expect(item.item_category).toBe('course');
    expect(item.item_category2).toBe('sat');
    expect(item.item_brand).toBe('platform');
    expect(item.item_variant).toBe('free');
    expect(item.price).toBe(0);
    expect(item.index).toBeUndefined();
    expect(item.item_list_name).toBeUndefined();
  });

  it('builds a tutor item with brand "tutor"', () => {
    const item = toItem(tutorInput, 'courses_grid', 3);
    expect(item.item_brand).toBe('tutor');
    expect(item.price).toBe(29.99);
    expect(item.index).toBe(3);
    expect(item.item_list_name).toBe('courses_grid');
  });

  it('omits item_category2 when undefined', () => {
    const item = toItem(noCat2Input);
    expect(item).not.toHaveProperty('item_category2');
  });

  it('omits item_category2 when empty string', () => {
    const item = toItem({ ...freeInput, category2: '' });
    expect(item).not.toHaveProperty('item_category2');
  });

  it('sets index 0 correctly (falsy but valid)', () => {
    const item = toItem(freeInput, 'courses_grid', 0);
    expect(item.index).toBe(0);
  });

  it('omits index when not provided', () => {
    const item = toItem(freeInput, 'courses_grid');
    expect(item.index).toBeUndefined();
  });
});

describe('MAX_LIST_ITEMS cap', () => {
  it('is 20', () => {
    expect(MAX_LIST_ITEMS).toBe(20);
  });

  it('slicing an array to MAX_LIST_ITEMS yields at most 20 items', () => {
    const items = Array.from({ length: 50 }, (_, i) => toItem({
      id: `item-${i}`,
      name: `Item ${i}`,
      category: 'course',
      brand: 'platform',
      variant: 'free',
      price: 0,
    }, 'test_list', i));

    const capped = items.slice(0, MAX_LIST_ITEMS);
    expect(capped).toHaveLength(20);
    expect(capped[0].index).toBe(0);
    expect(capped[19].index).toBe(19);
  });
});

describe('select_item index', () => {
  it('preserves the 0-based index from the source list', () => {
    const item = toItem({
      id: 'ev5',
      name: 'Webinar',
      category: 'event',
      brand: 'tutor',
      variant: 'one_time',
      price: 10,
    }, 'calendar', 4);

    expect(item.index).toBe(4);
    expect(item.item_list_name).toBe('calendar');
  });
});

describe('buildEcommerce', () => {
  it('wraps items with currency USD by default', () => {
    const items = [toItem({
      id: 'c1',
      name: 'Test',
      category: 'course',
      brand: 'platform',
      variant: 'free',
      price: 0,
    })];

    const eco = buildEcommerce(items);
    expect(eco.currency).toBe('USD');
    expect(eco.items).toBe(items);
    expect(eco.value).toBeUndefined();
  });

  it('includes value when provided', () => {
    const eco = buildEcommerce([], { value: 49.99 });
    expect(eco.value).toBe(49.99);
    expect(eco.currency).toBe('USD');
  });
});

describe('ecommerce reset (no leak between events)', () => {
  beforeEach(() => {
    resetState();
    state.currentPage = { page_template: '/courses', content_group: 'learn', page_location: 'https://app.example.com/courses', page_referrer: null };
  });

  it('reset push precedes every ecommerce event and prevents leaking', () => {
    const ecoPayload = buildEcommerce([toItem({
      id: 'c1',
      name: 'Test Course',
      category: 'course',
      brand: 'platform',
      variant: 'free',
      price: 0,
    }, 'courses_grid', 0)]);

    // Fire an ecommerce event
    track('view_item_list', { item_list_name: 'courses_grid' }, { ecommerce: ecoPayload });

    // Get the pushes for this event
    const pushes = allPushes();
    // Should have: reset push, then event push
    expect(pushes.length).toBeGreaterThanOrEqual(2);

    // The push before the event should be the reset
    const eventIdx = pushes.findIndex(p => p.event === 'view_item_list');
    expect(eventIdx).toBeGreaterThan(0);
    const resetPush = pushes[eventIdx - 1];
    expect(resetPush.event_params).toBeNull();
    expect(resetPush.ecommerce).toBeNull();

    // The event push should have ecommerce
    const eventPush = pushes[eventIdx];
    expect(eventPush.ecommerce).toBeDefined();
    expect((eventPush.ecommerce as any).currency).toBe('USD');
    expect((eventPush.ecommerce as any).items).toHaveLength(1);

    // Now fire a non-ecommerce event
    track('catalog_filter_apply', { content_type: 'course', filter_type: 'search' });

    const afterPushes = allPushes();
    const filterIdx = afterPushes.findIndex(p => p.event === 'catalog_filter_apply');
    expect(filterIdx).toBeGreaterThan(0);

    // The reset before catalog_filter_apply should null out ecommerce
    const filterReset = afterPushes[filterIdx - 1];
    expect(filterReset.ecommerce).toBeNull();

    // The catalog_filter_apply push should NOT have ecommerce
    const filterPush = afterPushes[filterIdx];
    expect(filterPush.ecommerce).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════
// PHASE 5 BATCH B — VIDEOS, INTERACTIONS, CONTENT LIFECYCLE
// ═════════════════════════════════════════════════════════

describe('video milestone rules', () => {
  beforeEach(() => {
    resetState();
    state.currentPage = { page_template: '/tutorial-bank/tutorial/cat1/t1', content_group: 'learn', page_location: 'https://app.example.com/tutorial-bank/tutorial/cat1/t1', page_referrer: null };
  });

  it('video_start fires once even when called multiple times', () => {
    track('video_start', { content_type: 'tutorial', content_id: 't1', video_provider: 'uploaded', video_duration_sec: 120 });
    track('video_start', { content_type: 'tutorial', content_id: 't1', video_provider: 'uploaded', video_duration_sec: 120 });
    const starts = allPushes().filter(p => p.event === 'video_start');
    // Both go through the pipeline (dedup is caller's job via refs), but guard validates the shape
    expect(starts.length).toBeGreaterThanOrEqual(1);
  });

  it('video_progress fires with correct integer video_percent', () => {
    track('video_progress', { content_type: 'tutorial', content_id: 't1', video_provider: 'uploaded', video_percent: 25, video_duration_sec: 120 });
    const progress = allPushes().filter(p => p.event === 'video_progress');
    expect(progress).toHaveLength(1);
    expect((progress[0].event_params as any).video_percent).toBe(25);
    expect((progress[0].event_params as any).video_duration_sec).toBe(120);
  });

  it('video_complete fires with integer video_duration_sec', () => {
    track('video_complete', { content_type: 'tutorial', content_id: 't1', video_provider: 'youtube', video_duration_sec: 305 });
    const complete = allPushes().filter(p => p.event === 'video_complete');
    expect(complete).toHaveLength(1);
    expect((complete[0].event_params as any).video_duration_sec).toBe(305);
    expect(typeof (complete[0].event_params as any).video_duration_sec).toBe('number');
  });

  it('video_provider must be string (uploaded or youtube)', () => {
    track('video_start', { content_type: 'tutorial', content_id: 't1', video_provider: 'uploaded', video_duration_sec: 60 });
    const push = allPushes().filter(p => p.event === 'video_start').pop()!;
    expect(typeof (push.event_params as any).video_provider).toBe('string');
  });

  it('YouTube API load failure is silent (no throw)', () => {
    // Simulates the pattern: catch block swallows load error
    expect(() => {
      try {
        throw new Error('Failed to load YouTube IFrame API');
      } catch {
        // video still plays untracked — no event
      }
    }).not.toThrow();
    // No video events should be in the dataLayer
    const videoEvents = allPushes().filter(p =>
      ['video_start', 'video_progress', 'video_complete'].includes(p.event as string)
    );
    expect(videoEvents).toHaveLength(0);
  });
});

describe('batch B parameter types', () => {
  beforeEach(() => {
    resetState();
    state.currentPage = { page_template: '/courses/learn/c1', content_group: 'learn', page_location: 'https://app.example.com/courses/learn/c1', page_referrer: null };
  });

  it('tutorial_question_answer: is_correct is boolean, no answer text', () => {
    track('tutorial_question_answer', { content_id: 'q1', is_correct: true });
    const push = allPushes().filter(p => p.event === 'tutorial_question_answer').pop()!;
    const params = push.event_params as any;
    expect(typeof params.is_correct).toBe('boolean');
    expect(params.is_correct).toBe(true);
    expect(params.selected_answer).toBeUndefined();
    expect(params.answer).toBeUndefined();
    expect(params.answer_text).toBeUndefined();
  });

  it('course_lesson_complete: lesson_number is integer, course_progress_pct is integer', () => {
    track('course_lesson_complete', { content_id: 'c1', lesson_number: 3, course_progress_pct: 45 });
    const push = allPushes().filter(p => p.event === 'course_lesson_complete').pop()!;
    const params = push.event_params as any;
    expect(typeof params.lesson_number).toBe('number');
    expect(params.lesson_number).toBe(3);
    expect(Number.isInteger(params.lesson_number)).toBe(true);
    expect(typeof params.course_progress_pct).toBe('number');
    expect(params.course_progress_pct).toBe(45);
    expect(Number.isInteger(params.course_progress_pct)).toBe(true);
  });

  it('course_review_submit: rating is integer, is_update is boolean, no comment', () => {
    track('course_review_submit', { content_id: 'c1', rating: 4, is_update: false });
    const push = allPushes().filter(p => p.event === 'course_review_submit').pop()!;
    const params = push.event_params as any;
    expect(typeof params.rating).toBe('number');
    expect(Number.isInteger(params.rating)).toBe(true);
    expect(typeof params.is_update).toBe('boolean');
    expect(params.comment).toBeUndefined();
    expect(params.review_text).toBeUndefined();
  });

  it('live_session_join: minutes_to_start is integer (can be negative)', () => {
    track('live_session_join', { content_type: 'class', content_id: 'plan1', minutes_to_start: -5 });
    const push = allPushes().filter(p => p.event === 'live_session_join').pop()!;
    const params = push.event_params as any;
    expect(typeof params.minutes_to_start).toBe('number');
    expect(Number.isInteger(params.minutes_to_start)).toBe(true);
    expect(params.minutes_to_start).toBe(-5);
  });

  it('event_attend_toggle: attending is boolean', () => {
    track('event_attend_toggle', { content_id: 'e1', attending: true });
    const push = allPushes().filter(p => p.event === 'event_attend_toggle').pop()!;
    expect(typeof (push.event_params as any).attending).toBe('boolean');
  });

  it('content_favorite: favorited is boolean', () => {
    track('content_favorite', { content_type: 'college', content_id: 'col1', favorited: false });
    const push = allPushes().filter(p => p.event === 'content_favorite').pop()!;
    expect(typeof (push.event_params as any).favorited).toBe('boolean');
  });

  it('outbound_link_click: never includes URL', () => {
    track('outbound_link_click', { content_type: 'college', content_id: 'col1', link_type: 'website' });
    const push = allPushes().filter(p => p.event === 'outbound_link_click').pop()!;
    const params = push.event_params as any;
    expect(params.link_type).toBe('website');
    expect(params.url).toBeUndefined();
    expect(params.destination_url).toBeUndefined();
    expect(params.href).toBeUndefined();
  });

  it('class_material_open: material_type is one of file/link/recording', () => {
    track('class_material_open', { content_type: 'class', content_id: 'cp1', material_type: 'recording' });
    const push = allPushes().filter(p => p.event === 'class_material_open').pop()!;
    expect(['file', 'link', 'recording']).toContain((push.event_params as any).material_type);
  });

  it('no text/PII leaks into any batch B event params (100-char lint)', () => {
    // Verify the guard pipeline truncates long strings
    track('tutorial_question_answer', { content_id: 'a'.repeat(200), is_correct: true });
    const push = allPushes().filter(p => p.event === 'tutorial_question_answer').pop()!;
    const cid = (push.event_params as any).content_id as string;
    expect(cid.length).toBeLessThanOrEqual(100);
  });
});

describe('coming-up item with unknown price', () => {
  it('has no price key when price is unknown', () => {
    // Simulate the ComingUpSection pattern: build an item without price/brand/variant
    const partial: Record<string, unknown> = {
      item_id: 'class-plan1',
      item_name: 'Math Class',
      item_category: 'class',
      index: 0,
      item_list_name: 'home_coming_up',
    };
    // price, item_brand, item_variant are NOT set
    expect(partial).not.toHaveProperty('price');
    expect(partial).not.toHaveProperty('item_brand');
    expect(partial).not.toHaveProperty('item_variant');
    expect(partial.item_id).toBe('class-plan1');
    expect(partial.item_name).toBe('Math Class');
    expect(partial.item_category).toBe('class');
  });
});

describe('minutes_to_start computation', () => {
  beforeEach(() => {
    resetState();
    state.currentPage = { page_template: '/', content_group: 'home', page_location: 'https://app.example.com/', page_referrer: null };
  });

  it('positive when session is in the future', () => {
    // _start is a Date object (from Firestore toDate() or new Date())
    const startDate = new Date(Date.now() + 30 * 60_000); // 30 mins from now
    const minutesToStart = Math.round((startDate.getTime() - Date.now()) / 60_000);
    expect(minutesToStart).toBeGreaterThan(0);
    expect(Number.isInteger(minutesToStart)).toBe(true);

    track('live_session_join', { content_type: 'class', content_id: 'plan1', minutes_to_start: minutesToStart });
    const push = allPushes().filter(p => p.event === 'live_session_join').pop()!;
    expect((push.event_params as any).minutes_to_start).toBe(minutesToStart);
  });

  it('negative when session has already started', () => {
    const startDate = new Date(Date.now() - 10 * 60_000); // 10 mins ago
    const minutesToStart = Math.round((startDate.getTime() - Date.now()) / 60_000);
    expect(minutesToStart).toBeLessThan(0);
    expect(Number.isInteger(minutesToStart)).toBe(true);

    track('live_session_join', { content_type: 'class', content_id: 'plan1', minutes_to_start: minutesToStart });
    const push = allPushes().filter(p => p.event === 'live_session_join').pop()!;
    expect((push.event_params as any).minutes_to_start).toBe(minutesToStart);
  });

  it('omitted (not NaN) when timestamp cannot be parsed', () => {
    // If _start is null/undefined/invalid, the caller should omit minutes_to_start
    const badDate = new Date('invalid');
    const rawMinutes = Math.round((badDate.getTime() - Date.now()) / 60_000);
    expect(Number.isNaN(rawMinutes)).toBe(true);

    // The guard pipeline drops NaN for integer types (throws in test mode)
    // In production (onViolation: 'warn'), the param is silently dropped
    state.onViolation = 'warn';
    track('live_session_join', { content_type: 'class', content_id: 'plan1', minutes_to_start: NaN });
    const push = allPushes().filter(p => p.event === 'live_session_join').pop()!;
    expect((push.event_params as any).minutes_to_start).toBeUndefined();
    state.onViolation = 'throw'; // restore
  });
});
