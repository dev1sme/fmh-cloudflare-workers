import { Button, Group, Stack, Title } from "@mantine/core";
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

  const { hoaDon, loading, error, reload } = useInvoiceDetail(code);
  const { luuPhiKhac, huy, xoa, ghiNhanThanhToan, xoaThanhToan } = useThaoTacHoaDon(code, reload, () =>
    navigate("/invoices"),
  );
  const { xacNhan, hopThoai } = useConfirm();

  function hoiHuy() {
    xacNhan({
      title: "Huỷ hóa đơn",
      message: "Hóa đơn được giữ lại để tra cứu nhưng không thu tiền được nữa.",
      confirmLabel: "Huỷ hóa đơn",
      color: "orange",
      onConfirm: huy,
    });
  }

  function hoiXoa() {
    xacNhan({
      title: "Xoá hóa đơn",
      message: "Xoá hẳn hóa đơn này. Chỉ số của kỳ vẫn còn nên có thể sinh lại.",
      confirmLabel: "Xoá",
      onConfirm: xoa,
    });
  }

  function hoiXoaThanhToan(payment: Payment) {
    xacNhan({
      title: "Xoá khoản thu",
      message: `Xoá khoản thu ${tien(payment.amount)}? Trạng thái hóa đơn sẽ được tính lại.`,
      confirmLabel: "Xoá",
      onConfirm: () => xoaThanhToan(payment.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>
          {hoaDon ? `${hoaDon.code} — ${hoaDon.room_name}` : "Hóa đơn"}
        </Title>
        <Button variant="subtle" component={Link} to="/invoices">
          ← Danh sách
        </Button>
      </Group>

      <PageState loading={loading} error={error}>
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
