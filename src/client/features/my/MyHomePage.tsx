import { Alert, Box, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconCircleCheck } from "@tabler/icons-react";

import { BankTransferCard } from "../../components/BankTransferCard";
import { InvoiceLines } from "../../components/InvoiceLines";
import { MomoCard } from "../../components/MomoCard";
import { PageState } from "../../components/PageState";
import { periodLabel, tien } from "../../format";
import { MonthList } from "./components/MonthList";
import { UsageTrend } from "./components/UsageTrend";
import { useDashboardCuaToi, useInvoicesCuaToiChiTiet } from "./useMine";

/**
 * The tenant's only screen.
 *
 * Everything they came for is here: what this month costs and how to pay it,
 * then a history column with a usage trend and every earlier month. Below
 * `md` the two stack into one column in that same order — the current bill
 * comes first regardless of screen size.
 *
 * On a laptop the shell has the width to show both at once instead of
 * spreading one narrow column across it, which is what made this read as a
 * phone-only screen even when opened on a desktop.
 *
 * The hero card is the newest month that actually has an invoice, loaded in
 * full (line items, QR, bank details) — not just the newest period. A manager
 * records this month's meters before generating its invoice, and during that
 * gap the newest *period* has nothing to pay while an older one still does;
 * featuring the period instead of the payable invoice would hide the QR the
 * tenant actually needs. Everything else stays as one-line summaries and
 * opens on demand — but the history section itself is always visible, even
 * with nothing in it yet, rather than disappearing when there is only one
 * month on record.
 */
export function MyHomePage() {
  const { soLieu, loading, error } = useDashboardCuaToi();
  const ganNhat = soLieu?.months.find((m) => m.code !== null) ?? soLieu?.months[0];
  const lichSu = soLieu?.months.filter((m) => m !== ganNhat) ?? [];

  // Only the newest month needs its QR and line items up front.
  const { hoaDon } = useInvoicesCuaToiChiTiet(ganNhat?.code ?? "");

  return (
    <PageState loading={loading} error={error}>
      {soLieu && (
        <Stack gap="lg">
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.06em" }}>
                Phòng
              </Text>
              <Title order={2}>{soLieu.room_name}</Title>
            </div>

            {soLieu.outstanding_total > 0 ? (
              <Text className="fmh-num" fw={700} fz="1.35rem" c="owed.6">
                Cần đóng {tien(soLieu.outstanding_total)}
              </Text>
            ) : (
              <Group gap={6} c="settled.6">
                <IconCircleCheck size={18} stroke={1.8} />
                <Text fw={600}>Đã thanh toán đủ</Text>
              </Group>
            )}
          </Group>

          <Box className="fmh-tenant-grid">
            {/* Left / top: the month being paid right now. */}
            <Stack gap="md">
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
                      <Alert color="gray" variant="light">
                        Chủ nhà đã ghi chỉ số nhưng chưa phát hành hóa đơn cho kỳ này.
                      </Alert>
                    ) : (
                      hoaDon && <InvoiceLines invoice={hoaDon} />
                    )}
                  </Stack>
                </Card>
              )}

              {hoaDon?.bank_transfer && <BankTransferCard chuyenKhoan={hoaDon.bank_transfer} />}
              {hoaDon?.momo && <MomoCard momo={hoaDon.momo} />}
            </Stack>

            {/* Right / bottom: trend across months, then each month in full. */}
            <Stack gap="md">
              <UsageTrend months={soLieu.months} />

              {lichSu.length > 0 ? (
                <MonthList months={lichSu} />
              ) : (
                <Card>
                  <Text size="sm" c="dimmed">
                    Chưa có tháng nào trước đó để xem lại — lịch sử sẽ hiện ở đây từ tháng kế tiếp.
                  </Text>
                </Card>
              )}
            </Stack>
          </Box>
        </Stack>
      )}
    </PageState>
  );
}
