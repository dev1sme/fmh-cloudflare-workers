import { Button, Group, Stack, Title } from "@mantine/core";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { Payment } from "../../../shared/types";
import { InvoiceLines } from "../../components/InvoiceLines";
import { PageState } from "../../components/PageState";
import { tien } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { InvoiceActions } from "./components/InvoiceActions";
import { InvoiceHeader } from "./components/InvoiceHeader";
import { PaymentsCard } from "./components/PaymentsCard";
import { PhiKhacCard } from "./components/PhiKhacCard";
import { useHoaDonChiTiet, useThaoTacHoaDon } from "./useHoaDonChiTiet";

export function InvoiceDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();

  const { hoaDon, loading, error, reload } = useHoaDonChiTiet(id);
  const { luuPhiKhac, huy, xoa, ghiNhanThanhToan, xoaThanhToan } = useThaoTacHoaDon(id, reload, () =>
    navigate("/hoa-don"),
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
      message: `Xoá khoản thu ${tien(payment.so_tien)}? Trạng thái hóa đơn sẽ được tính lại.`,
      confirmLabel: "Xoá",
      onConfirm: () => xoaThanhToan(payment.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>
          {hoaDon ? `${hoaDon.ma_hoa_don} — ${hoaDon.ten_phong}` : "Hóa đơn"}
        </Title>
        <Button variant="subtle" component={Link} to="/hoa-don">
          ← Danh sách
        </Button>
      </Group>

      <PageState loading={loading} error={error}>
        {hoaDon && (
          <Stack>
            <InvoiceHeader hoaDon={hoaDon} />
            <InvoiceLines invoice={hoaDon} />
            <PhiKhacCard phiKhac={hoaDon.phi_khac} onSave={luuPhiKhac} />
            <PaymentsCard
              hoaDon={hoaDon}
              onPay={ghiNhanThanhToan}
              onDeletePayment={hoiXoaThanhToan}
            />
            <InvoiceActions
              daHuy={hoaDon.trang_thai === "huy"}
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
