import { Box, Button, Stack } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ReadingDetail } from "../../../shared/types";
import { PeriodPicker } from "../../components/PeriodPicker";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { PageState } from "../../components/PageState";
import { periodLabel } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { usePeriodParam } from "../../hooks/usePeriodParam";
import { ReadingModal, type ReadingTarget } from "./components/ReadingModal";
import { ReadingCards } from "./components/ReadingCards";
import { ReadingsTable } from "./components/ReadingsTable";
import { useReadingsForPeriod, useReadingActions } from "./useReadings";

export function ReadingsPage() {
  const [period, setPeriod] = usePeriodParam();
  const { rooms, readingForRoom, loading, refreshing, error, reload } = useReadingsForPeriod(period);
  const { suggest, save, remove } = useReadingActions(period, reload);
  const { confirm, confirmDialog } = useConfirm();
  const { t } = useTranslation();

  const [entering, setEntering] = useState<ReadingTarget | null>(null);

  function askDelete(reading: ReadingDetail) {
    confirm({
      title: t("readings.deleteTitle"),
      message: t("readings.confirmDelete", {
        room: reading.room_name,
        period: periodLabel(reading.period),
      }),
      confirmLabel: t("common.delete"),
      onConfirm: () => remove(reading.code),
    });
  }

  const headerContext = loading
    ? undefined
    : t("pageContext.readings", {
        recorded: rooms.filter((room) => readingForRoom(room.id)).length,
        total: rooms.length,
      });

  return (
    <Stack>
      <PageHeader
        title={t("nav.readings")}
        context={headerContext}
        actions={
          <>
            <PeriodPicker value={period} onChange={setPeriod} />
          </>
        }
      />

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {/* Rows here are rooms, not readings — an empty table means no rooms
            exist, which is not fixable from this screen. */}
        {rooms.length === 0 ? (
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
          <>
            {/* Seven columns at minWidth 760. */}
            <Box visibleFrom="sm">
              <ReadingsTable
                rooms={rooms}
                readingForRoom={readingForRoom}
                onEdit={(room, reading) => setEntering({ room, reading })}
                onDelete={askDelete}
              />
            </Box>
            <Box hiddenFrom="sm">
              <ReadingCards
                rooms={rooms}
                readingForRoom={readingForRoom}
                onEdit={(room, reading) => setEntering({ room, reading })}
                onDelete={askDelete}
              />
            </Box>
          </>
        )}
      </PageState>

      <ReadingModal
        period={period}
        target={entering}
        suggest={suggest}
        onClose={() => setEntering(null)}
        onSubmit={save}
      />
      {confirmDialog}
    </Stack>
  );
}
