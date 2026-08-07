import { Alert, Box, Card, Group, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import { IconCircleCheck } from "@tabler/icons-react";
import { useState } from "react";

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

const PHAM_VI = [
  { value: "3", label: "3 tháng" },
  { value: "6", label: "6 tháng" },
  { value: "all", label: "Tất cả" },
];

/** Six, not three: three months is too short to show that electricity climbs
 *  in the hot season, which is the question the trend exists to answer. Not
 *  all, because the server hands back up to 24 and that is unreadable on a
 *  phone. */
const MAC_DINH = "6";

export function MyHomePage() {
  const { soLieu, loading, error } = useDashboardCuaToi();
  const [phamVi, setPhamVi] = useState(MAC_DINH);

  const tatCa = soLieu?.months ?? [];
  const ganNhat = tatCa.find((m) => m.code !== null) ?? tatCa[0];

  // One window, two views of it: the chart plots it, the list shows the rest
  // of it after the featured month is taken out. Applying the range to the
  // list alone would leave the chart and the list a month out of step with
  // each other for no reason a tenant could work out.
  const soThang = phamVi === "all" ? tatCa.length : Number(phamVi);
  const cuaSo = tatCa.slice(0, soThang);

  // An unpaid month outside the window is still listed. Otherwise the header
  // says "Cần đóng 2.415.000" while no row on the screen accounts for it, and
  // a display filter would be quietly hiding a debt. It is kept out of the
  // chart, though: a gap-jumping point next to its neighbour reads as the
  // month after it.
  const noNgoaiKhoang = tatCa.slice(soThang).filter((m) => m !== ganNhat && m.outstanding > 0);
  const lichSu = [...cuaSo.filter((m) => m !== ganNhat), ...noNgoaiKhoang];

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

            {/* Right / bottom: trend across months, then each month in full.
                One control governs both — they answer the same question, and
                two pickers side by side would need setting twice. */}
            <Stack gap="md">
              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <Text
                  size="xs"
                  c="dimmed"
                  tt="uppercase"
                  fw={600}
                  style={{ letterSpacing: "0.06em" }}
                >
                  Lịch sử
                </Text>
                <SegmentedControl
                  size="xs"
                  value={phamVi}
                  onChange={setPhamVi}
                  data={PHAM_VI}
                  aria-label="Khoảng thời gian"
                />
              </Group>

              <UsageTrend months={cuaSo} />

              {lichSu.length > 0 ? (
                <MonthList months={lichSu} noNgoaiKhoang={noNgoaiKhoang.length} />
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
