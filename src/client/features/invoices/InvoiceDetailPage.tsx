import { Button, Group, Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { Payment } from "../../../shared/types";
import { BankTransferCard } from "../../components/BankTransferCard";
import { InvoiceLines } from "../../components/InvoiceLines";
import { MomoCard } from "../../components/MomoCard";
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
      color: "orange",
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

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>
          {invoice ? `${invoice.code} — ${invoice.room_name}` : t("invoice.fallbackTitle")}
        </Title>
        <Button variant="subtle" component={Link} to="/invoices">
          ← {t("invoices.backToList")}
        </Button>
      </Group>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {invoice && (
          <Stack>
            <InvoiceHeader invoice={invoice} />
            <InvoiceLines invoice={invoice} />
            {invoice.bank_transfer && (
              <BankTransferCard transfer={invoice.bank_transfer} preview />
            )}
            {invoice.momo && <MomoCard momo={invoice.momo} preview />}
            <OtherFeesCard otherFees={invoice.other_fees} onSave={saveOtherFees} />
            <PaymentsCard
              invoice={invoice}
              onPay={recordPayment}
              onDeletePayment={askDeletePayment}
            />
            <InvoiceActions
              cancelled={invoice.status === "CANCELLED"}
              onCancel={askCancel}
              onDelete={askDelete}
            />
          </Stack>
        )}
      </PageState>

      {confirmDialog}
    </Stack>
  );
}
