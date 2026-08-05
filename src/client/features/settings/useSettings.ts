import { buildings as buildingsApi, type BuildingInput } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import { useResource } from "../../hooks/useResource";

export function useDanhSachNha() {
  const { data, loading, error, reload } = useResource(() => buildingsApi.list());
  return { nha: data?.buildings ?? [], loading, error, reload };
}

export function useThaoTacNha(reload: () => void) {
  async function them(input: BuildingInput): Promise<boolean> {
    try {
      await buildingsApi.create(input);
      baoThanhCong("Đã thêm nhà.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function luu(id: number, patch: Partial<BuildingInput>): Promise<boolean> {
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

  /** Rejected by the API while the building still has rooms. */
  async function xoa(id: number): Promise<boolean> {
    try {
      await buildingsApi.remove(id);
      baoThanhCong("Đã xoá nhà.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { them, luu, xoa };
}
