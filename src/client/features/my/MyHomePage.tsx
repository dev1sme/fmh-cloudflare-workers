import { Alert, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconCircleCheck } from "@tabler/icons-react";

import { BankTransferCard } from "../../components/BankTransferCard";
import { MomoCard } from "../../components/MomoCard";
import { PageState } from "../../components/PageState";
import { InvoiceLines } from "../../components/InvoiceLines";
import { periodLabel, tien } from "../../format";
import { MonthList } from "./components/MonthList";
import { useInvoicesCuaToiChiTiet, useDashboardCuaToi } from "./useMine";

/**
 * The tenant's only screen.
 *
 * Everything they came for is here, in the order they need it: what this month
 * costs, how to pay it, then the months before. Nothing to navigate — the
 * three separate screens this replaces all showed slices of the same table,
 * and a tenant who visits twice a month should not have to learn a menu.
 *
 * The newest month is loaded in full (line items, QR, bank details) because
 * that is the one being paid. Older months stay as one-line summaries and open
 * on demand.
 */
export function MyHomePage() {
  const { soLieu, loading, error } = useDashboardCuaToi();
  const ganNhat = soLieu?.months[0];

  // Only the newest month needs its QR and line items up front.
  const { hoaDon } = useInvoicesCuaToiChiTiet(ganNhat?.code ?? "");

  return (
    <PageState loading={loading} error={error}>
      {soLieu && (
        <Stack gap="lg">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.06em" }}>
              Phòng
            </Text>
            <Title order={2}>{soLieu.room_name}</Title>
          </div>

          {soLieu.outstanding_total > 0 ? (
            <Alert color="owed" variant="light" title="Cần thanh toán">
              <Text fw={700} fz="1.35rem" className="fmh-num" ta="left">
                {tien(soLieu.outstanding_total)}
              </Text>
            </Alert>
          ) : (
            <Alert
              color="settled"
              variant="light"
              icon={<IconCircleCheck size={20} />}
              title="Đã thanh toán đủ"
            >
              Không còn khoản nào phải đóng.
            </Alert>
          )}

          {ganNhat && (
            <Card>
              <Stack gap="md">
                <Group justify="space-between" align="baseline" wrap="nowrap">
                  <Title order={4}>{periodLabel(ganNhat.period)}</Title>
                  {ganNhat.code && (
                    <Text size="sm" c="dimmed">
                      {ganNhat.code}
                    </Text>
                  )}
                </Group>

                {ganNhat.total === null ? (
                  <Text c="dimmed" size="sm">
                    Chủ nhà đã ghi chỉ số nhưng chưa phát hành hóa đơn cho kỳ này.
                  </Text>
                ) : hoaDon ? (
                  <InvoiceLines invoice={hoaDon} />
                ) : null}
              </Stack>
            </Card>
          )}

          {hoaDon?.bank_transfer && <BankTransferCard chuyenKhoan={hoaDon.bank_transfer} />}
          {hoaDon?.momo && <MomoCard momo={hoaDon.momo} />}

          {soLieu.months.length > 1 && <MonthList months={soLieu.months.slice(1)} />}
        </Stack>
      )}
    </PageState>
  );
}
