import {
  rooms as roomsApi,
  tenants as tenantsApi,
  type TenantInput,
  type TenantPatch,
} from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import i18n from "../../i18n";
import { homNay } from "../../format";
import { useResource } from "../../hooks/useResource";

/** Every tenancy, past and present, plus the rooms to file them under. */
export function useDanhSachNguoiThue() {
  const nguoiThue = useResource(() => tenantsApi.list(), []);
  const phong = useResource(() => roomsApi.list(), []);

  return {
    nguoiThue: nguoiThue.data?.tenants ?? [],
    phong: phong.data?.rooms ?? [],
    loading: nguoiThue.loading || phong.loading,
    refreshing: nguoiThue.refreshing || phong.refreshing,
    error: nguoiThue.error ?? phong.error,
    // Both: `error` can be either request's, so a retry has to cover both.
    reload: () => {
      nguoiThue.reload();
      phong.reload();
    },
  };
}

export function useThaoTacNguoiThue(reload: () => void) {
  async function them(input: TenantInput): Promise<boolean> {
    try {
      await tenantsApi.create(input);
      baoThanhCong(i18n.t("tenantForm.added"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function capNhat(code: string, patch: TenantPatch): Promise<boolean> {
    try {
      await tenantsApi.update(code, patch);
      baoThanhCong(i18n.t("tenants.saved"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  const chuyenDi = (code: string) => capNhat(code, { moved_out: homNay() });

  /** Undo a move-out recorded by mistake. Fails if the room is taken again. */
  const huyChuyenDi = (code: string) => capNhat(code, { moved_out: null });

  async function xoa(code: string): Promise<boolean> {
    try {
      await tenantsApi.remove(code);
      baoThanhCong(i18n.t("tenants.deleted"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { them, capNhat, chuyenDi, huyChuyenDi, xoa };
}
