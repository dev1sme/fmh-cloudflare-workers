import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

import { PeriodPicker } from "../../components/PeriodPicker";
import { PageState } from "../../components/PageState";
import { kyHienTai, nhanKy } from "../../format";
import { InvoicesTable } from "./components/InvoicesTable";
import { GenerateInvoicesModal } from "./components/GenerateInvoicesModal";
import { SkippedAlert } from "./components/SkippedAlert";
import { useInvoicesTheoKy, useSinhHoaDon, useXemTruocSinh } from "./useInvoices";

export function InvoicesPage() {
  const [ky, setKy] = useState(kyHienTai());
  const [moSinh, setMoSinh] = useState(false);

  const { hoaDon, tongTien, loading, error, reload } = useInvoicesTheoKy(ky);
  const { sinh, dangChay, ketQua, xoaKetQua } = useSinhHoaDon(ky, reload);
  const xemTruoc = useXemTruocSinh(ky, moSinh);

  async function xacNhanSinh(roomIds: number[]) {
    if (await sinh(roomIds)) setMoSinh(false);
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Hóa đơn</Title>
        <Group align="flex-end">
          <PeriodPicker value={ky} onChange={setKy} />
          <Button onClick={() => setMoSinh(true)}>
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

      <GenerateInvoicesModal
        ky={ky}
        opened={moSinh}
        phong={xemTruoc.phong}
        loading={xemTruoc.loading}
        error={xemTruoc.error}
        dangChay={dangChay}
        onClose={() => setMoSinh(false)}
        onSubmit={xacNhanSinh}
      />
    </Stack>
  );
}
