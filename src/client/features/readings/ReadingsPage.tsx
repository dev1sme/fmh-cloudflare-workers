import { Group, Stack, Title } from "@mantine/core";
import { useState } from "react";

import type { ReadingDetail } from "../../../shared/types";
import { PeriodPicker } from "../../components/PeriodPicker";
import { PageState } from "../../components/PageState";
import { kyHienTai, nhanKy } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { ReadingModal, type MucTieu } from "./components/ReadingModal";
import { ReadingsTable } from "./components/ReadingsTable";
import { useReadingsTheoKy, useThaoTacChiSo } from "./useReadings";

export function ReadingsPage() {
  const [ky, setKy] = useState(kyHienTai());
  const { phong, chiSoCuaPhong, loading, error, reload } = useReadingsTheoKy(ky);
  const { goiY, luu, xoa } = useThaoTacChiSo(ky, reload);
  const { xacNhan, hopThoai } = useConfirm();

  const [dangNhap, setDangNhap] = useState<MucTieu | null>(null);

  function hoiXoa(reading: ReadingDetail) {
    xacNhan({
      title: "Xoá chỉ số",
      message: `Xoá chỉ số ${reading.ten_phong} ${nhanKy(reading.ky).toLowerCase()}? Hóa đơn của kỳ này sẽ không sinh lại được cho tới khi nhập lại.`,
      confirmLabel: "Xoá",
      onConfirm: () => xoa(reading.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Chỉ số điện nước</Title>
        <PeriodPicker value={ky} onChange={setKy} />
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
        ky={ky}
        target={dangNhap}
        goiY={goiY}
        onClose={() => setDangNhap(null)}
        onSubmit={luu}
      />
      {hopThoai}
    </Stack>
  );
}
