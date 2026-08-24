import { buildings as buildingsApi, type BuildingInput } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export function useDanhSachNha() {
  const { data, loading, refreshing, error, reload } = useResource(() => buildingsApi.list());
  return { nha: data?.buildings ?? [], loading, refreshing, error, reload };
}

export function useThaoTacNha(reload: () => void) {
  async function them(input: BuildingInput): Promise<boolean> {
    try {
      await buildingsApi.create(input);
      baoThanhCong(i18n.t("settings.added"));
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
      baoThanhCong(i18n.t("settings.saved"));
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
      baoThanhCong(i18n.t("settings.deleted"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { them, luu, xoa };
}
