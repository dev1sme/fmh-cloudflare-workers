import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { Link, useParams } from "react-router-dom";

import { BankTransferCard } from "../../components/BankTransferCard";
import { InvoiceLines } from "../../components/InvoiceLines";
import { MomoCard } from "../../components/MomoCard";
import { PageState } from "../../components/PageState";
import { PaymentsTable } from "../../components/PaymentsTable";
import { StatusBadge } from "../../components/StatusBadge";
import { periodLabel } from "../../format";
import { TransferInstructions } from "./components/TransferInstructions";
import { useInvoicesCuaToiChiTiet } from "./useMine";

export function MyInvoiceDetailPage() {
  const id = Number(useParams().id);
  const { hoaDon, loading, error } = useInvoicesCuaToiChiTiet(id);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{hoaDon ? hoaDon.invoice_code : "Hóa đơn"}</Title>
        <Button variant="subtle" component={Link} to="/my-invoices">
          ← Danh sách
        </Button>
      </Group>

      <PageState loading={loading} error={error}>
        {hoaDon && (
          <Stack>
            <Group>
              <Text c="dimmed">{periodLabel(hoaDon.period)}</Text>
              <StatusBadge value={hoaDon.status} />
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

            {hoaDon.bank_transfer ? (
              <BankTransferCard chuyenKhoan={hoaDon.bank_transfer} />
            ) : (
              !hoaDon.momo &&
              hoaDon.outstanding > 0 &&
              hoaDon.status !== "CANCELLED" && (
                <TransferInstructions maHoaDon={hoaDon.invoice_code} />
              )
            )}

            {hoaDon.momo && <MomoCard momo={hoaDon.momo} />}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
