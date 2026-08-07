import { useMemo, useState } from "react";

import type { GenerateResult } from "../../../shared/types";
import { invoices as invoicesApi } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export function useInvoicesTheoKy(period: string) {
  const { data, loading, error, reload } = useResource(() => invoicesApi.list({ period }), [period]);
  const hoaDon = data?.invoices ?? [];

  return {
    hoaDon,
    tongTien: hoaDon.reduce((sum, invoice) => sum + invoice.total, 0),
    loading,
    error,
    reload,
  };
}

/**
 * The rooms a generation run would touch, loaded only while the picker is open
 * so closing the modal and changing the period both refetch cleanly.
 */
export function useXemTruocSinh(period: string, mo: boolean) {
  const { data, loading, error } = useResource(
    () => (mo ? invoicesApi.preview(period) : Promise.resolve(null)),
    [period, mo],
  );

  // Memoised: the picker seeds its selection from this list in an effect, and a
  // fresh array on every render would loop.
  const rooms = useMemo(() => data?.rooms ?? [], [data]);

  return { rooms, loading: mo && loading, error };
}

/**
 * Generation for a period, for the rooms the manager picked. `ketQua` holds the
 * last run so the screen can list the rooms that were skipped and why.
 */
export function useSinhHoaDon(period: string, reload: () => void) {
  const [ketQua, setKetQua] = useState<GenerateResult | null>(null);
  const [dangChay, setDangChay] = useState(false);

  async function sinh(roomIds: number[]): Promise<boolean> {
    setDangChay(true);

    try {
      const result = await invoicesApi.generate(period, roomIds);
      setKetQua(result);
      baoThanhCong(i18n.t("invoices.generated", { count: result.created.length }));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    } finally {
      setDangChay(false);
    }
  }

  return { sinh, dangChay, ketQua, xoaKetQua: () => setKetQua(null) };
}
