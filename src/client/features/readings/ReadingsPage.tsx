import { Button, Group, Stack, Title } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ReadingDetail } from "../../../shared/types";
import { PeriodPicker } from "../../components/PeriodPicker";
import { EmptyState } from "../../components/EmptyState";
import { PageState } from "../../components/PageState";
import { currentPeriod, periodLabel } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { ReadingModal, type MucTieu } from "./components/ReadingModal";
import { ReadingsTable } from "./components/ReadingsTable";
import { useReadingsTheoKy, useThaoTacChiSo } from "./useReadings";

export function ReadingsPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const { phong, chiSoCuaPhong, loading, refreshing, error, reload } = useReadingsTheoKy(period);
  const { goiY, luu, xoa } = useThaoTacChiSo(period, reload);
  const { xacNhan, hopThoai } = useConfirm();
  const { t } = useTranslation();

  const [dangNhap, setDangNhap] = useState<MucTieu | null>(null);

  function hoiXoa(reading: ReadingDetail) {
    xacNhan({
      title: t("readings.deleteTitle"),
      message: t("readings.confirmDelete", {
        room: reading.room_name,
        period: periodLabel(reading.period),
      }),
      confirmLabel: t("common.delete"),
      onConfirm: () => xoa(reading.code),
    });
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>{t("nav.readings")}</Title>
        <PeriodPicker value={period} onChange={setPeriod} />
      </Group>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {/* Rows here are rooms, not readings — an empty table means no rooms
            exist, which is not fixable from this screen. */}
        {phong.length === 0 ? (
          <EmptyState
            icon={<IconHome size={24} stroke={1.6} />}
            title={t("readings.emptyRooms")}
            hint={t("readings.emptyRoomsHint")}
            action={
              <Button component={Link} to="/rooms" variant="light">
                {t("nav.rooms")}
              </Button>
            }
          />
        ) : (
          <ReadingsTable
            phong={phong}
            chiSoCuaPhong={chiSoCuaPhong}
            onEdit={(room, reading) => setDangNhap({ room, reading })}
            onDelete={hoiXoa}
          />
        )}
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
