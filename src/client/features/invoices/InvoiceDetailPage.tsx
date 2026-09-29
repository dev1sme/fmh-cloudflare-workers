import { Box, Button, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { Payment } from "../../../shared/types";
import { InvoiceLines } from "../../components/InvoiceLines";
import { PageHeader } from "../../components/PageHeader";
import { PaymentMethods } from "../../components/PaymentMethods";
import { PageState } from "../../components/PageState";
import { money } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { InvoiceActions } from "./components/InvoiceActions";
import { InvoiceHeader } from "./components/InvoiceHeader";
import { PaymentsCard } from "./components/PaymentsCard";
import { OtherFeesCard } from "./components/OtherFeesCard";
import { useInvoiceDetail, useInvoiceActions } from "./useInvoiceDetail";

export function InvoiceDetailPage() {
  const code = (useParams().code ?? "").toUpperCase();
  const navigate = useNavigate();

  const { invoice, loading, refreshing, error, reload } = useInvoiceDetail(code);
  const { saveOtherFees, cancel, remove, recordPayment, removePayment } = useInvoiceActions(code, reload, () =>
    navigate("/invoices"),
  );
  const { confirm, confirmDialog } = useConfirm();
  const { t } = useTranslation();

  function askCancel() {
    confirm({
      title: t("invoices.cancel"),
      message: t("invoices.confirmCancel"),
      confirmLabel: t("invoices.cancel"),
      color: "red",
      onConfirm: cancel,
    });
  }

  function askDelete() {
    confirm({
      title: t("invoices.delete"),
      message: t("invoices.confirmDelete"),
      confirmLabel: t("common.delete"),
      onConfirm: remove,
    });
  }

  function askDeletePayment(payment: Payment) {
    confirm({
      title: t("invoices.deletePaymentTitle"),
      message: t("invoices.confirmDeletePayment", { amount: money(payment.amount) }),
      confirmLabel: t("common.delete"),
      onConfirm: () => removePayment(payment.code),
    });
  }

  const hasPaymentMethods = Boolean(invoice?.bank_transfer || invoice?.momo);

  return (
    <Stack>
      <PageHeader
        title={invoice ? `${invoice.code} — ${invoice.room_name}` : t("invoice.fallbackTitle")}
        context={invoice && <InvoiceHeader invoice={invoice} />}
        actions={
          <Button variant="subtle" component={Link} to="/invoices">
            ← {t("invoices.backToList")}
          </Button>
        }
      />

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {invoice && (
          // Two columns on a wide screen: the invoice and what is done to it on
          // the left, what the tenant is shown on the right. One column used
          // to leave half of a laptop screen empty beside a 520 px stack.
          <Box className={hasPaymentMethods ? "fmh-detail-grid" : undefined}>
            <Stack>
              <InvoiceLines invoice={invoice} />
              <PaymentsCard
                invoice={invoice}
                onPay={recordPayment}
                onDeletePayment={askDeletePayment}
              />
              <OtherFeesCard otherFees={invoice.other_fees} onSave={saveOtherFees} />
              <InvoiceActions
                cancelled={invoice.status === "CANCELLED"}
                onCancel={askCancel}
                onDelete={askDelete}
              />
            </Stack>

            {hasPaymentMethods && (
              <Box className="fmh-detail-aside">
                <PaymentMethods transfer={invoice.bank_transfer} momo={invoice.momo} preview />
              </Box>
            )}
          </Box>
        )}
      </PageState>

      {confirmDialog}
    </Stack>
  );
}
