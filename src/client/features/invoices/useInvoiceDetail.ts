import { invoices as invoicesApi } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export type ThanhToanMoi = {
  amount: number;
  paid_on: string;
  method: string;
  note: string | null;
};

export function useInvoiceDetail(code: string) {
  const { data, loading, refreshing, error, reload } = useResource(
    () => invoicesApi.get(code),
    [code],
  );
  return { hoaDon: data?.invoice ?? null, loading, refreshing, error, reload };
}

/**
 * Actions on a single invoice.
 *
 * `don_gia_*` is intentionally absent: the API refuses to patch it, because a
 * stored invoice must keep the tariff it was issued at. Wrong price means
 * delete and regenerate.
 */
export function useThaoTacHoaDon(code: string, reload: () => void, onDeleted: () => void) {
  async function luuPhiKhac(phiKhac: number): Promise<boolean> {
    try {
      await invoicesApi.update(code, { other_fees: phiKhac });
      baoThanhCong(i18n.t("invoices.otherFeesSaved"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function huy(): Promise<boolean> {
    try {
      await invoicesApi.update(code, { status: "CANCELLED" });
      baoThanhCong(i18n.t("invoices.cancelled"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function xoa(): Promise<boolean> {
    try {
      await invoicesApi.remove(code);
      baoThanhCong(i18n.t("invoices.deleted"));
      onDeleted();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function ghiNhanThanhToan(input: ThanhToanMoi): Promise<boolean> {
    try {
      await invoicesApi.pay(code, input);
      baoThanhCong(i18n.t("invoices.paymentRecorded"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function xoaThanhToan(paymentCode: string): Promise<boolean> {
    try {
      await invoicesApi.removePayment(paymentCode);
      baoThanhCong(i18n.t("invoices.paymentDeleted"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { luuPhiKhac, huy, xoa, ghiNhanThanhToan, xoaThanhToan };
}
