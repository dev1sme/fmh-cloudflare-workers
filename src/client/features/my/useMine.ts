import { me } from "../../api";
import { useResource } from "../../hooks/useResource";

/** Everything here is scoped to the tenant's own room by the API. */

export function useRoomsCuaToi() {
  const { data, loading, error } = useResource(() => me.room(), []);
  return { phong: data?.room ?? null, loading, error };
}

export function useInvoicesCuaToi() {
  const { data, loading, error } = useResource(() => me.invoices(), []);
  return { hoaDon: data?.invoices ?? [], loading, error };
}

export function useInvoicesCuaToiChiTiet(id: number) {
  const { data, loading, error } = useResource(() => me.invoice(id), [id]);
  return { hoaDon: data?.invoice ?? null, loading, error };
}

export function useReadingsCuaToi() {
  const { data, loading, error } = useResource(() => me.readings(), []);
  return { chiSo: data?.readings ?? [], loading, error };
}
