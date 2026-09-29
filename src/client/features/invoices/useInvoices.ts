import { useMemo, useState } from "react";

import type { GenerateResult } from "../../../shared/types";
import { invoices as invoicesApi } from "../../api";
import { toastError, toastSuccess } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export function useInvoicesForPeriod(period: string) {
  const { data, loading, refreshing, error, reload } = useResource(
    () => invoicesApi.list({ period }),
    [period],
  );
  const invoices = data?.invoices ?? [];

  return {
    invoices,
    grandTotal: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    loading,
    refreshing,
    error,
    reload,
  };
}

/**
 * The rooms a generation run would touch, loaded only while the picker is open
 * so closing the modal and changing the period both refetch cleanly.
 */
export function useGeneratePreview(period: string, enabled: boolean) {
  const { data, loading, error, reload } = useResource(
    () => (enabled ? invoicesApi.preview(period) : Promise.resolve(null)),
    [period, enabled],
  );

  // Memoised: the picker seeds its selection from this list in an effect, and a
  // fresh array on every render would loop.
  const rooms = useMemo(() => data?.rooms ?? [], [data]);

  return { rooms, loading: enabled && loading, error, reload };
}

/**
 * Generation for a period, for the rooms the manager picked. `lastResult` holds the
 * last run so the screen can list the rooms that were skipped and why.
 */
export function useGenerateInvoices(period: string, reload: () => void) {
  const [lastResult, setLastResult] = useState<GenerateResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate(roomIds: number[]): Promise<boolean> {
    setBusy(true);

    try {
      const result = await invoicesApi.generate(period, roomIds);
      setLastResult(result);
      toastSuccess(i18n.t("invoices.generated", { count: result.created.length }));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { generate, busy, result: lastResult, clearResult: () => setLastResult(null) };
}
