import { Button, Group, Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { Payment } from "../../../shared/types";
import { BankTransferCard } from "../../components/BankTransferCard";
import { InvoiceLines } from "../../components/InvoiceLines";
import { MomoCard } from "../../components/MomoCard";
import { PageState } from "../../components/PageState";
import { tien } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { InvoiceActions } from "./components/InvoiceActions";
import { InvoiceHeader } from "./components/InvoiceHeader";
import { PaymentsCard } from "./components/PaymentsCard";
import { OtherFeesCard } from "./components/OtherFeesCard";
import { useInvoiceDetail, useThaoTacHoaDon } from "./useInvoiceDetail";

export function InvoiceDetailPage() {
  const code = (useParams().code ?? "").toUpperCase();
  const navigate = useNavigate();

  const { hoaDon, loading, refreshing, error, reload } = useInvoiceDetail(code);
  const { luuPhiKhac, huy, xoa, ghiNhanThanhToan, xoaThanhToan } = useThaoTacHoaDon(code, reload, () =>
    navigate("/invoices"),
  );
  const { xacNhan, hopThoai } = useConfirm();
  const { t } = useTranslation();

  function hoiHuy() {
    xacNhan({
      title: t("invoices.cancel"),
      message: t("invoices.confirmCancel"),
      confirmLabel: t("invoices.cancel"),
      color: "orange",
      onConfirm: huy,
    });
  }

  function hoiXoa() {
    xacNhan({
      title: t("invoices.delete"),
      message: t("invoices.confirmDelete"),
      confirmLabel: t("common.delete"),
      onConfirm: xoa,
    });
  }

  function hoiXoaThanhToan(payment: Payment) {
    xacNhan({
      title: t("invoices.deletePaymentTitle"),
      message: t("invoices.confirmDeletePayment", { amount: tien(payment.amount) }),
      confirmLabel: t("common.delete"),
      onConfirm: () => xoaThanhToan(payment.code),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>
          {hoaDon ? `${hoaDon.code} — ${hoaDon.room_name}` : t("invoice.fallbackTitle")}
        </Title>
        <Button variant="subtle" component={Link} to="/invoices">
          ← {t("invoices.backToList")}
        </Button>
      </Group>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {hoaDon && (
          <Stack>
            <InvoiceHeader hoaDon={hoaDon} />
            <InvoiceLines invoice={hoaDon} />
            {hoaDon.bank_transfer && (
              <BankTransferCard chuyenKhoan={hoaDon.bank_transfer} xemTruoc />
            )}
            {hoaDon.momo && <MomoCard momo={hoaDon.momo} xemTruoc />}
            <OtherFeesCard phiKhac={hoaDon.other_fees} onSave={luuPhiKhac} />
            <PaymentsCard
              hoaDon={hoaDon}
              onPay={ghiNhanThanhToan}
              onDeletePayment={hoiXoaThanhToan}
            />
            <InvoiceActions
              daHuy={hoaDon.status === "CANCELLED"}
              onCancel={hoiHuy}
              onDelete={hoiXoa}
            />
          </Stack>
        )}
      </PageState>

      {hopThoai}
    </Stack>
  );
}
