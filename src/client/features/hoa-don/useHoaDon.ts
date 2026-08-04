import { useState } from "react";

import type { GenerateResult } from "../../../shared/types";
import { invoices as invoicesApi } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import { useResource } from "../../hooks/useResource";

export function useHoaDonTheoKy(ky: string) {
  const { data, loading, error, reload } = useResource(() => invoicesApi.list({ ky }), [ky]);
  const hoaDon = data?.invoices ?? [];

  return {
    hoaDon,
    tongTien: hoaDon.reduce((sum, invoice) => sum + invoice.tong_tien, 0),
    loading,
    error,
    reload,
  };
}

/**
 * Bulk generation for a period. `ketQua` holds the last run so the screen can
 * list the rooms that were skipped and why.
 */
export function useSinhHoaDon(ky: string, reload: () => void) {
  const [ketQua, setKetQua] = useState<GenerateResult | null>(null);
  const [dangChay, setDangChay] = useState(false);

  async function sinh() {
    setDangChay(true);

    try {
      const result = await invoicesApi.generate(ky);
      setKetQua(result);
      baoThanhCong(`Đã sinh ${result.created.length} hóa đơn.`);
      reload();
    } catch (err) {
      baoLoi(err);
    } finally {
      setDangChay(false);
    }
  }

  return { sinh, dangChay, ketQua, xoaKetQua: () => setKetQua(null) };
}
