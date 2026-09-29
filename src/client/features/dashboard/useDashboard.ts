import { dashboard as dashboardApi } from "../../api";
import { useResource } from "../../hooks/useResource";

export function useDashboard(period: string) {
  const { data, loading, refreshing, error, reload } = useResource(
    () => dashboardApi.get(period),
    [period],
  );

  return { dashboard: data, loading, refreshing, error, reload };
}
