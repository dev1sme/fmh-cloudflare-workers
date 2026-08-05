import { dashboard as dashboardApi } from "../../api";
import { useResource } from "../../hooks/useResource";

export function useDashboard(ky: string) {
  const { data, loading, error } = useResource(() => dashboardApi.get(ky), [ky]);

  return { soLieu: data, loading, error };
}
