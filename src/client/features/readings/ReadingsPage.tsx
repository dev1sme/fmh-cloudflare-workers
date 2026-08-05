import { Group, Stack, Title } from "@mantine/core";
import { useState } from "react";

import type { ReadingDetail } from "../../../shared/types";
import { PeriodPicker } from "../../components/PeriodPicker";
import { PageState } from "../../components/PageState";
import { currentPeriod, periodLabel } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { ReadingModal, type MucTieu } from "./components/ReadingModal";
import { ReadingsTable } from "./components/ReadingsTable";
import { useReadingsTheoKy, useThaoTacChiSo } from "./useReadings";

export function ReadingsPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const { phong, chiSoCuaPhong, loading, error, reload } = useReadingsTheoKy(period);
  const { goiY, luu, xoa } = useThaoTacChiSo(period, reload);
  const { xacNhan, hopThoai } = useConfirm();

  const [dangNhap, setDangNhap] = useState<MucTieu | null>(null);

  function hoiXoa(reading: ReadingDetail) {
    xacNhan({
      title: "Xoá chỉ số",
      message: `Xoá chỉ số ${reading.room_name} ${periodLabel(reading.period).toLowerCase()}? Hóa đơn của kỳ này sẽ không sinh lại được cho tới khi nhập lại.`,
      confirmLabel: "Xoá",
      onConfirm: () => xoa(reading.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Chỉ số điện nước</Title>
        <PeriodPicker value={period} onChange={setPeriod} />
      </Group>

      <PageState loading={loading} error={error}>
        <ReadingsTable
          phong={phong}
          chiSoCuaPhong={chiSoCuaPhong}
          onEdit={(room, reading) => setDangNhap({ room, reading })}
          onDelete={hoiXoa}
        />
      </PageState>

      <ReadingModal
        period={period}
        target={dangNhap}
        goiY={goiY}
        onClose={() => setDangNhap(null)}
        onSubmit={luu}
      />
      {hopThoai}
    </Stack>
  );
}
