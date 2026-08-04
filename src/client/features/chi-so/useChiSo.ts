import { useCallback } from "react";

import type { ReadingDetail } from "../../../shared/types";
import { readings as readingsApi, rooms as roomsApi } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import { useResource } from "../../hooks/useResource";

export type ChiSoNhap = {
  dien_cu: number;
  dien_moi: number;
  nuoc_cu: number;
  nuoc_moi: number;
  ngay_ghi: string;
};

/** Rooms for the period, each with its reading when one has been recorded. */
export function useChiSoTheoKy(ky: string) {
  const phong = useResource(() => roomsApi.list(), []);
  const chiSo = useResource(() => readingsApi.list({ ky }), [ky]);

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

export function useThaoTacChiSo(ky: string, reload: () => void) {
  /**
   * Opening numbers carried over from the previous period.
   *
   * Memoised because ReadingModal calls it from an effect — an unstable
   * reference would re-run that effect on every render.
   */
  const goiY = useCallback((roomId: number) => readingsApi.suggest(roomId, ky), [ky]);

  async function luu(
    target: { roomId: number; readingId: number | null },
    input: ChiSoNhap,
  ): Promise<boolean> {
    try {
      if (target.readingId === null) {
        await readingsApi.create({ room_id: target.roomId, ky, ...input });
      } else {
        await readingsApi.update(target.readingId, input);
      }
      baoThanhCong("Đã lưu chỉ số.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function xoa(id: number): Promise<boolean> {
    try {
      await readingsApi.remove(id);
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
