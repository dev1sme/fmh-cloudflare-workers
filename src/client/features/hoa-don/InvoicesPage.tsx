import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

import { KyPicker } from "../../components/KyPicker";
import { PageState } from "../../components/PageState";
import { kyHienTai, nhanKy } from "../../format";
import { InvoicesTable } from "./components/InvoicesTable";
import { SkippedAlert } from "./components/SkippedAlert";
import { useHoaDonTheoKy, useSinhHoaDon } from "./useHoaDon";

export function InvoicesPage() {
  const [ky, setKy] = useState(kyHienTai());
  const { hoaDon, tongTien, loading, error, reload } = useHoaDonTheoKy(ky);
  const { sinh, dangChay, ketQua, xoaKetQua } = useSinhHoaDon(ky, reload);

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Hóa đơn</Title>
        <Group align="flex-end">
          <KyPicker value={ky} onChange={setKy} />
          <Button onClick={sinh} loading={dangChay}>
            Sinh hóa đơn {nhanKy(ky).toLowerCase()}
          </Button>
        </Group>
      </Group>

      {ketQua && <SkippedAlert skipped={ketQua.skipped} onClose={xoaKetQua} />}

      <PageState loading={loading} error={error}>
        {hoaDon.length === 0 ? (
          <Text c="dimmed">Chưa có hóa đơn nào cho {nhanKy(ky).toLowerCase()}.</Text>
        ) : (
          <InvoicesTable hoaDon={hoaDon} tongTien={tongTien} />
        )}
      </PageState>
    </Stack>
  );
}
