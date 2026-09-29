import {
  rooms as roomsApi,
  tenants as tenantsApi,
  type TenantInput,
  type TenantPatch,
} from "../../api";
import { toastError, toastSuccess } from "../../errors";
import i18n from "../../i18n";
import { today } from "../../format";
import { useResource } from "../../hooks/useResource";

/** Every tenancy, past and present, plus the rooms to file them under. */
export function useTenantList() {
  const tenants = useResource(() => tenantsApi.list(), []);
  const rooms = useResource(() => roomsApi.list(), []);

  return {
    tenants: tenants.data?.tenants ?? [],
    rooms: rooms.data?.rooms ?? [],
    loading: tenants.loading || rooms.loading,
    refreshing: tenants.refreshing || rooms.refreshing,
    error: tenants.error ?? rooms.error,
    // Both: `error` can be either request's, so a retry has to cover both.
    reload: () => {
      tenants.reload();
      rooms.reload();
    },
  };
}

export function useTenantActions(reload: () => void) {
  async function add(input: TenantInput): Promise<boolean> {
    try {
      await tenantsApi.create(input);
      toastSuccess(i18n.t("tenantForm.added"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function update(code: string, patch: TenantPatch): Promise<boolean> {
    try {
      await tenantsApi.update(code, patch);
      toastSuccess(i18n.t("tenants.saved"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  const moveOut = (code: string) => update(code, { moved_out: today() });

  /** Undo a move-out recorded by mistake. Fails if the room is taken again. */
  const undoMoveOut = (code: string) => update(code, { moved_out: null });

  async function remove(code: string): Promise<boolean> {
    try {
      await tenantsApi.remove(code);
      toastSuccess(i18n.t("tenants.deleted"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  return { add, update, moveOut, undoMoveOut, remove };
}
