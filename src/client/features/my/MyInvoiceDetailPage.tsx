import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { Link, useParams } from "react-router-dom";

import { ChuyenKhoanCard } from "../../components/ChuyenKhoanCard";
import { InvoiceLines } from "../../components/InvoiceLines";
import { MomoCard } from "../../components/MomoCard";
import { PageState } from "../../components/PageState";
import { PaymentsTable } from "../../components/PaymentsTable";
import { StatusBadge } from "../../components/StatusBadge";
import { nhanKy } from "../../format";
import { TransferInstructions } from "./components/TransferInstructions";
import { useInvoicesCuaToiChiTiet } from "./useMine";

export function MyInvoiceDetailPage() {
  const id = Number(useParams().id);
  const { hoaDon, loading, error } = useInvoicesCuaToiChiTiet(id);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{hoaDon ? hoaDon.ma_hoa_don : "Hóa đơn"}</Title>
        <Button variant="subtle" component={Link} to="/my-invoices">
          ← Danh sách
        </Button>
      </Group>

      <PageState loading={loading} error={error}>
        {hoaDon && (
          <Stack>
            <Group>
              <Text c="dimmed">{nhanKy(hoaDon.ky)}</Text>
              <StatusBadge value={hoaDon.trang_thai} />
            </Group>

            <InvoiceLines invoice={hoaDon} />

            {hoaDon.payments.length > 0 && (
              <Card withBorder padding="md">
                <Stack gap="sm">
                  <Text fw={500}>Đã thanh toán</Text>
                  <PaymentsTable payments={hoaDon.payments} />
                </Stack>
              </Card>
            )}

            {hoaDon.chuyen_khoan ? (
              <ChuyenKhoanCard chuyenKhoan={hoaDon.chuyen_khoan} />
            ) : (
              !hoaDon.momo &&
              hoaDon.con_lai > 0 &&
              hoaDon.trang_thai !== "huy" && (
                <TransferInstructions maHoaDon={hoaDon.ma_hoa_don} />
              )
            )}

            {hoaDon.momo && <MomoCard momo={hoaDon.momo} />}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
