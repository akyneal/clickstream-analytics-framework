/**
 * usePageTracking hook.
 * Fires trackPageView once per distinct path+search, only after auth resolves.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from './track';

/**
 * Mount once inside the Router. Fires page_view on each route change,
 * waiting for auth to resolve so the first page_view carries the right user_role.
 *
 * @param authResolved — true once auth state is known (signed in or explicitly anonymous)
 */
export function usePageTracking(authResolved: boolean): void {
  const location = useLocation();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!authResolved) return;

    const key = location.pathname + location.search;
    if (key === lastKey.current) return;
    lastKey.current = key;

    trackPageView(location);
  }, [authResolved, location.pathname, location.search]);
}
