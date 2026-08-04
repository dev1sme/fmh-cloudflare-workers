import { useCallback, useEffect, useState } from "react";

type Resource<T> = {
  data: T | null;
  loading: boolean;
  error: unknown;
  /** Re-runs the loader, e.g. after a mutation. */
  reload: () => void;
};

/**
 * Minimal data loading: fetch on mount, reload on demand. No cache and no
 * background revalidation — at two rooms and one manager, a query library would
 * be more machinery than the app needs.
 */
export function useResource<T>(loader: () => Promise<T>, deps: unknown[] = []): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  // The loader closes over `deps`; recreating it every render is fine because
  // the effect below only re-runs when deps or `tick` change.
  const run = useCallback(loader, deps);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    run()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [run, tick]);

  return { data, loading, error, reload: useCallback(() => setTick((n) => n + 1), []) };
}
