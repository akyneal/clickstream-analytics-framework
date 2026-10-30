/**
 * Route resolution, URL sanitizing, and tutor-mode detection.
 * page_template and content_group come from ROUTE_TO_GROUP in plan.generated.ts.
 */

import { ALLOWED_QUERY_KEYS, BOOLEAN_QUERY_KEYS } from './config';
import { ROUTE_TO_GROUP, UNMAPPED_ROUTES, type ContentGroup } from './plan.generated';
import { state } from './state';

// ── Public content routes ────────────────────────────────
// Routes in the publicContent group of routes.ts.  When the visitor is signed
// out they report content_group = "public_content"; when signed in they report
// their feature group.
const PUBLIC_CONTENT_ROUTES = new Set([
  '/feed', '/posts/:postId', '/spaces', '/spaces/:spaceId',
  '/tests', '/questions', '/classes', '/classes/:id',
  '/tutorial-bank', '/tutorial-bank/category/:categoryId',
  '/tutorial-bank/tutorial/:categoryId/:tutorialId',
  '/courses', '/courses/course/:id',
  '/colleges', '/scholarships', '/internships', '/applicant-profiles',
  '/community/tutors', '/community/profile/:userId',
  '/calendar', '/calendar/event/:id',
  '/resources', '/resources/:id',
  '/unsubscribe',
]);

// ── Route matching ───────────────────────────────────────

/** Convert a route template like "/tests/:testId/take" into a regex. */
function templateToRegex(template: string): RegExp {
  const pattern = template
    .replace(/:[a-zA-Z_]+/g, '[^/]+')   // :param → match one segment
    .replace(/\//g, '\\/');               // escape slashes
  return new RegExp(`^${pattern}$`);
}

interface CompiledRoute {
  template: string;
  group: ContentGroup;
  regex: RegExp;
}

let compiledRoutes: CompiledRoute[] | null = null;

function getCompiledRoutes(): CompiledRoute[] {
  if (compiledRoutes) return compiledRoutes;
  compiledRoutes = [];
  for (const [template, group] of ROUTE_TO_GROUP.entries()) {
    compiledRoutes.push({ template, group, regex: templateToRegex(template) });
  }
  // Sort by specificity: more segments first, then by length
  compiledRoutes.sort((a, b) => {
    const aSegs = a.template.split('/').length;
    const bSegs = b.template.split('/').length;
    if (aSegs !== bSegs) return bSegs - aSegs;
    return b.template.length - a.template.length;
  });
  return compiledRoutes;
}

let compiledUnmapped: RegExp[] | null = null;

function getCompiledUnmapped(): RegExp[] {
  if (compiledUnmapped) return compiledUnmapped;
  compiledUnmapped = Array.from(UNMAPPED_ROUTES).map(templateToRegex);
  return compiledUnmapped;
}

export interface RouteMatch {
  page_template: string;
  content_group: ContentGroup | 'public_content';
}

/**
 * Resolve a pathname to its page_template and content_group.
 * Returns null for unmapped routes (no events should fire).
 */
export function resolveRoute(pathname: string): RouteMatch | null {
  // Check unmapped first
  for (const re of getCompiledUnmapped()) {
    if (re.test(pathname)) return null;
  }

  // Match against mapped routes
  for (const route of getCompiledRoutes()) {
    if (route.regex.test(pathname)) {
      let group: ContentGroup | 'public_content' = route.group;

      // Public content routes report public_content when signed out
      if (PUBLIC_CONTENT_ROUTES.has(route.template)) {
        const isSignedOut = !state.currentUser || state.currentUser.user_role === 'anonymous';
        if (isSignedOut) {
          group = 'public_content';
        }
      }

      return { page_template: route.template, content_group: group };
    }
  }

  // Unknown route — treat as unmapped
  return null;
}

// ── URL sanitizing ───────────────────────────────────────

/**
 * Sanitize a URL for page_location: keep only allowed query keys,
 * convert boolean keys to flags, strip hash.
 */
export function sanitizePageUrl(url: string): string {
  try {
    const u = new URL(url);
    const clean = new URLSearchParams();
    for (const [key, value] of u.searchParams.entries()) {
      if (key in BOOLEAN_QUERY_KEYS) {
        // Convert to boolean flag — value doesn't matter, presence = true
        clean.set(BOOLEAN_QUERY_KEYS[key], 'true');
      } else if (ALLOWED_QUERY_KEYS.has(key)) {
        clean.set(key, value);
      }
    }
    const qs = clean.toString();
    return u.origin + u.pathname + (qs ? `?${qs}` : '');
  } catch {
    return url;
  }
}

/**
 * Sanitize an external referrer: origin + path only, no query string.
 */
export function sanitizeReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    const u = new URL(referrer);
    return u.origin + u.pathname;
  } catch {
    return null;
  }
}

/**
 * Replace ID-like path segments with :id.
 * Matches: UUIDs, Firebase UIDs (20+ alphanum), numeric IDs, short hex strings.
 */
export function toEndpointTemplate(path: string): string {
  return path.replace(
    /\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|[a-zA-Z0-9]{20,}|[0-9]+|[0-9a-fA-F]{6,})\b/g,
    '/:id',
  );
}

// ── Tutor mode detection ─────────────────────────────────

/**
 * Detect tutor mode from URL search params.
 * Tutor mode: studentId in query, mode=tutor, or a study plan URL with mode set.
 */
export function isTutorMode(search: string): boolean {
  try {
    const params = new URLSearchParams(search);
    if (params.has('studentId')) return true;
    const mode = params.get('mode');
    if (mode === 'tutor') return true;
    // Study plan URLs with any mode param are tutor-viewing
    if (mode && mode !== '') return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Strip studentId from search params for page_location sanitizing.
 */
export function stripStudentId(search: string): string {
  try {
    const params = new URLSearchParams(search);
    params.delete('studentId');
    const result = params.toString();
    return result ? `?${result}` : '';
  } catch {
    return search;
  }
}

/** Reset compiled routes (for testing). */
export function _resetCompiledRoutes(): void {
  compiledRoutes = null;
  compiledUnmapped = null;
}
