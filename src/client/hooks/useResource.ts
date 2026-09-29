import { useCallback, useEffect, useRef, useState } from "react";

type Resource<T> = {
  data: T | null;
  /** First load, or a load whose result will replace what is on screen. */
  loading: boolean;
  /** The same query running again, with its previous result still displayed. */
  refreshing: boolean;
  error: unknown;
  /** Re-runs the loader, e.g. after a mutation. */
  reload: () => void;
};

/**
 * Minimal data loading: fetch on mount, reload on demand. No cache and no
 * background revalidation — at two rooms and one manager, a query library would
 * be more machinery than the app needs.
 *
 * `loading` and `refreshing` are split because the two cases must not look the
 * same. A **deps change** is a different query — the rows on screen belong to
 * last month's period, so they are wrong now and `loading` says "replace this".
 * A **`reload()`** is the same query again after a mutation, so its rows are
 * merely a moment stale; blanking the screen there threw away the invoice the
 * manager was reading to record a payment against, and made a 2 ms round trip
 * look like a page load.
 */
export function useResource<T>(loader: () => Promise<T>, deps: unknown[] = []): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  // The loader closes over `deps`; recreating it every render is fine because
  // the effect below only re-runs when deps or `tick` change.
  const run = useCallback(loader, deps);

  // Which of the two triggered this run: a new `run` identity means the deps
  // changed, the same one means `tick` did. Refs rather than state so reading
  // them does not put `data` in the effect's dependency list and re-fetch on
  // every arrival.
  const lastRun = useRef<typeof run | null>(null);
  const hasData = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const isRefresh = lastRun.current === run && hasData.current;
    lastRun.current = run;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    run()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          hasData.current = true;
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [run, tick]);

  return {
    data,
    loading,
    refreshing,
    error,
    reload: useCallback(() => setTick((n) => n + 1), []),
  };
}
