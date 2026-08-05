import { Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

import { PeriodPicker } from "../../components/PeriodPicker";
import { PageState } from "../../components/PageState";
import { currentPeriod, periodLabel } from "../../format";
import { InvoiceCards } from "./components/InvoiceCards";
import { InvoicesTable } from "./components/InvoicesTable";
import { GenerateInvoicesModal } from "./components/GenerateInvoicesModal";
import { SkippedAlert } from "./components/SkippedAlert";
import { useInvoicesTheoKy, useSinhHoaDon, useXemTruocSinh } from "./useInvoices";

export function InvoicesPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [moSinh, setMoSinh] = useState(false);

  const { hoaDon, tongTien, loading, error, reload } = useInvoicesTheoKy(period);
  const { sinh, dangChay, ketQua, xoaKetQua } = useSinhHoaDon(period, reload);
  const xemTruoc = useXemTruocSinh(period, moSinh);

  async function xacNhanSinh(roomIds: number[]) {
    if (await sinh(roomIds)) setMoSinh(false);
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Hóa đơn</Title>
        <Group align="flex-end">
          <PeriodPicker value={period} onChange={setPeriod} />
          <Button onClick={() => setMoSinh(true)}>
            Sinh hóa đơn {periodLabel(period).toLowerCase()}
          </Button>
        </Group>
      </Group>

      {ketQua && <SkippedAlert skipped={ketQua.skipped} onClose={xoaKetQua} />}

      <PageState loading={loading} error={error}>
        {hoaDon.length === 0 ? (
          <Text c="dimmed">Chưa có hóa đơn nào cho {periodLabel(period).toLowerCase()}.</Text>
        ) : (
          <>
            {/* Nine columns do not fit a phone; cards carry the same facts. */}
            <Box visibleFrom="sm">
              <InvoicesTable hoaDon={hoaDon} tongTien={tongTien} />
            </Box>
            <Box hiddenFrom="sm">
              <InvoiceCards hoaDon={hoaDon} />
            </Box>
          </>
        )}
      </PageState>

      <GenerateInvoicesModal
        period={period}
        opened={moSinh}
        rooms={xemTruoc.rooms}
        loading={xemTruoc.loading}
        error={xemTruoc.error}
        dangChay={dangChay}
        onClose={() => setMoSinh(false)}
        onSubmit={xacNhanSinh}
      />
    </Stack>
  );
}
