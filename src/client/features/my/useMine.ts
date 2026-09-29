import { me } from "../../api";
import { useResource } from "../../hooks/useResource";

/** Everything here is scoped to the tenant's own room by the API. */

export function useMyDashboard() {
  const { data, loading, refreshing, error, reload } = useResource(() => me.dashboard(), []);
  return { dashboard: data, loading, refreshing, error, reload };
}

/** `code` may be empty while the newest period has no invoice yet. */
export function useMyInvoice(code: string) {
  const { data, loading, refreshing, error } = useResource(
    () => (code ? me.invoice(code) : Promise.resolve(null)),
    [code],
  );
  return { invoice: data?.invoice ?? null, loading, refreshing, error };
}
