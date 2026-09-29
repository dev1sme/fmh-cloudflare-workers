import { invoices as invoicesApi } from "../../api";
import { toastError, toastSuccess } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export type NewPayment = {
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
  return { invoice: data?.invoice ?? null, loading, refreshing, error, reload };
}

/**
 * Actions on a single invoice.
 *
 * `don_gia_*` is intentionally absent: the API refuses to patch it, because a
 * stored invoice must keep the tariff it was issued at. Wrong price means
 * delete and regenerate.
 */
export function useInvoiceActions(code: string, reload: () => void, onDeleted: () => void) {
  async function saveOtherFees(otherFees: number): Promise<boolean> {
    try {
      await invoicesApi.update(code, { other_fees: otherFees });
      toastSuccess(i18n.t("invoices.otherFeesSaved"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function cancel(): Promise<boolean> {
    try {
      await invoicesApi.update(code, { status: "CANCELLED" });
      toastSuccess(i18n.t("invoices.cancelled"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function remove(): Promise<boolean> {
    try {
      await invoicesApi.remove(code);
      toastSuccess(i18n.t("invoices.deleted"));
      onDeleted();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function recordPayment(input: NewPayment): Promise<boolean> {
    try {
      await invoicesApi.pay(code, input);
      toastSuccess(i18n.t("invoices.paymentRecorded"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function removePayment(paymentCode: string): Promise<boolean> {
    try {
      await invoicesApi.removePayment(paymentCode);
      toastSuccess(i18n.t("invoices.paymentDeleted"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  return { saveOtherFees, cancel, remove, recordPayment, removePayment };
}
