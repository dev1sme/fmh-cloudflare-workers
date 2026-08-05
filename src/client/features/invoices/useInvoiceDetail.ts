import { invoices as invoicesApi } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import { useResource } from "../../hooks/useResource";

export type ThanhToanMoi = {
  amount: number;
  paid_on: string;
  method: string;
  note: string | null;
};

export function useInvoiceDetail(id: number) {
  const { data, loading, error, reload } = useResource(() => invoicesApi.get(id), [id]);
  return { hoaDon: data?.invoice ?? null, loading, error, reload };
}

/**
 * Actions on a single invoice.
 *
 * `don_gia_*` is intentionally absent: the API refuses to patch it, because a
 * stored invoice must keep the tariff it was issued at. Wrong price means
 * delete and regenerate.
 */
export function useThaoTacHoaDon(id: number, reload: () => void, onDeleted: () => void) {
  async function luuPhiKhac(phiKhac: number): Promise<boolean> {
    try {
      await invoicesApi.update(id, { other_fees: phiKhac });
      baoThanhCong("Đã cập nhật phí khác.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function huy(): Promise<boolean> {
    try {
      await invoicesApi.update(id, { status: "CANCELLED" });
      baoThanhCong("Đã huỷ hóa đơn.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function xoa(): Promise<boolean> {
    try {
      await invoicesApi.remove(id);
      baoThanhCong("Đã xoá hóa đơn.");
      onDeleted();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function ghiNhanThanhToan(input: ThanhToanMoi): Promise<boolean> {
    try {
      await invoicesApi.pay(id, input);
      baoThanhCong("Đã ghi nhận thanh toán.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function xoaThanhToan(paymentId: number): Promise<boolean> {
    try {
      await invoicesApi.removePayment(paymentId);
      baoThanhCong("Đã xoá khoản thu.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { luuPhiKhac, huy, xoa, ghiNhanThanhToan, xoaThanhToan };
}
