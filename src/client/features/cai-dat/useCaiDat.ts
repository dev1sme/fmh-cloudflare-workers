import type { Building } from "../../../shared/types";
import { buildings as buildingsApi } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import { useResource } from "../../hooks/useResource";

export function useDanhSachNha() {
  const { data, loading, error, reload } = useResource(() => buildingsApi.list());
  return { nha: data?.buildings ?? [], loading, error, reload };
}

export function useThaoTacNha(reload: () => void) {
  async function luu(id: number, patch: Partial<Building>): Promise<boolean> {
    try {
      await buildingsApi.update(id, patch);
      baoThanhCong("Đã lưu cài đặt nhà.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { luu };
}
