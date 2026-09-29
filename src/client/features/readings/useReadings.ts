import { useCallback } from "react";

import type { ReadingDetail } from "../../../shared/types";
import { readings as readingsApi, rooms as roomsApi } from "../../api";
import { toastError, toastSuccess } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export type ReadingEntry = {
  electricity_start: number;
  electricity_end: number;
  water_start: number;
  water_end: number;
  recorded_on: string;
};

/** Rooms for the period, each with its reading when one has been recorded. */
export function useReadingsForPeriod(period: string) {
  const rooms = useResource(() => roomsApi.list(), []);
  const readings = useResource(() => readingsApi.list({ period }), [period]);

  const byRoom = new Map<number, ReadingDetail>(
    readings.data?.readings.map((reading) => [reading.room_id, reading]),
  );

  return {
    rooms: rooms.data?.rooms ?? [],
    readingForRoom: (roomId: number) => byRoom.get(roomId) ?? null,
    loading: rooms.loading || readings.loading,
    refreshing: rooms.refreshing || readings.refreshing,
    error: rooms.error ?? readings.error,
    // Both: `error` can be either request's, so a retry has to cover both.
    reload: () => {
      rooms.reload();
      readings.reload();
    },
  };
}

export function useReadingActions(period: string, reload: () => void) {
  /**
   * Opening numbers carried over from the previous period.
   *
   * Memoised because ReadingModal calls it from an effect — an unstable
   * reference would re-run that effect on every render.
   */
  const suggest = useCallback((roomId: number) => readingsApi.suggest(roomId, period), [period]);

  async function save(
    target: { roomId: number; readingCode: string | null },
    input: ReadingEntry,
  ): Promise<boolean> {
    try {
      if (target.readingCode === null) {
        await readingsApi.create({ room_id: target.roomId, period, ...input });
      } else {
        await readingsApi.update(target.readingCode, input);
      }
      toastSuccess(i18n.t("readings.saved"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function remove(code: string): Promise<boolean> {
    try {
      await readingsApi.remove(code);
      toastSuccess(i18n.t("readings.deleted"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  return { suggest, save, remove };
}
