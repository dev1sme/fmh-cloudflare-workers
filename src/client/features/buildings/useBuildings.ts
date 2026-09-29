import { buildings as buildingsApi, type BuildingInput } from "../../api";
import { toastError, toastSuccess } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export function useBuildingList() {
  const { data, loading, refreshing, error, reload } = useResource(() => buildingsApi.list());
  return { buildings: data?.buildings ?? [], loading, refreshing, error, reload };
}

export function useBuildingActions(reload: () => void) {
  async function add(input: BuildingInput): Promise<boolean> {
    try {
      await buildingsApi.create(input);
      toastSuccess(i18n.t("buildings.added"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function save(id: number, patch: Partial<BuildingInput>): Promise<boolean> {
    try {
      await buildingsApi.update(id, patch);
      toastSuccess(i18n.t("buildings.saved"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  /** Rejected by the API while the building still has rooms. */
  async function remove(id: number): Promise<boolean> {
    try {
      await buildingsApi.remove(id);
      toastSuccess(i18n.t("buildings.deleted"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  return { add, save, remove };
}
