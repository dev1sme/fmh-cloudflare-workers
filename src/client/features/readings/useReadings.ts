import { useCallback } from "react";

import type { ReadingDetail } from "../../../shared/types";
import { readings as readingsApi, rooms as roomsApi } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import { useResource } from "../../hooks/useResource";

export type ChiSoNhap = {
  electricity_start: number;
  electricity_end: number;
  water_start: number;
  water_end: number;
  recorded_on: string;
};

/** Rooms for the period, each with its reading when one has been recorded. */
export function useReadingsTheoKy(period: string) {
  const phong = useResource(() => roomsApi.list(), []);
  const chiSo = useResource(() => readingsApi.list({ period }), [period]);

  const theoPhong = new Map<number, ReadingDetail>(
    chiSo.data?.readings.map((reading) => [reading.room_id, reading]),
  );

  return {
    phong: phong.data?.rooms ?? [],
    chiSoCuaPhong: (roomId: number) => theoPhong.get(roomId) ?? null,
    loading: phong.loading || chiSo.loading,
    error: phong.error ?? chiSo.error,
    reload: chiSo.reload,
  };
}

export function useThaoTacChiSo(period: string, reload: () => void) {
  /**
   * Opening numbers carried over from the previous period.
   *
   * Memoised because ReadingModal calls it from an effect — an unstable
   * reference would re-run that effect on every render.
   */
  const goiY = useCallback((roomId: number) => readingsApi.suggest(roomId, period), [period]);

  async function luu(
    target: { roomId: number; readingCode: string | null },
    input: ChiSoNhap,
  ): Promise<boolean> {
    try {
      if (target.readingCode === null) {
        await readingsApi.create({ room_id: target.roomId, period, ...input });
      } else {
        await readingsApi.update(target.readingCode, input);
      }
      baoThanhCong("Đã lưu chỉ số.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function xoa(code: string): Promise<boolean> {
    try {
      await readingsApi.remove(code);
      baoThanhCong("Đã xoá chỉ số.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { goiY, luu, xoa };
}
