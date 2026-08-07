import { me } from "../../api";
import { useResource } from "../../hooks/useResource";

/** Everything here is scoped to the tenant's own room by the API. */

export function useDashboardCuaToi() {
  const { data, loading, error } = useResource(() => me.dashboard(), []);
  return { soLieu: data, loading, error };
}

/** `code` may be empty while the newest period has no invoice yet. */
export function useInvoicesCuaToiChiTiet(code: string) {
  const { data, loading, error } = useResource(
    () => (code ? me.invoice(code) : Promise.resolve(null)),
    [code],
  );
  return { hoaDon: data?.invoice ?? null, loading, error };
}
