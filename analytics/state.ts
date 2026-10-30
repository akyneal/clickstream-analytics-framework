/** Per-tab state for the analytics module. */

import type { ViolationMode } from './config';

export interface PageContext {
  page_template: string;
  content_group: string;
  page_location: string;
  page_referrer: string | null;
}

export interface UserContext {
  user_id: string | null;
  user_role: string;
  login_state: string;
  traffic_type: string | null;
}

interface AnalyticsState {
  initialized: boolean;
  onViolation: ViolationMode;
  authResolved: boolean;
  currentPage: PageContext | null;
  currentUser: UserContext | null;
  previousUrl: string | null;
  onceKeys: Set<string>;
  /** The path+search of the current page_view, used to detect distinct navigations. */
  lastPageKey: string | null;
  /** Count of student_work_view pushes in the current page view (for tutor mode once-per-page). */
  tutorWorkViewFired: boolean;
}

export const state: AnalyticsState = {
  initialized: false,
  onViolation: 'silent',
  authResolved: false,
  currentPage: null,
  currentUser: null,
  previousUrl: null,
  onceKeys: new Set(),
  lastPageKey: null,
  tutorWorkViewFired: false,
};

/** Reset once-keys and tutor work view flag. Called on each new page_view. */
export function resetOnceKeys(): void {
  state.onceKeys.clear();
  state.tutorWorkViewFired = false;
}
