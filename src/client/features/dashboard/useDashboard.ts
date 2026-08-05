import { dashboard as dashboardApi } from "../../api";
import { useResource } from "../../hooks/useResource";

export function useDashboard(period: string) {
  const { data, loading, error } = useResource(() => dashboardApi.get(period), [period]);

  return { soLieu: data, loading, error };
}
