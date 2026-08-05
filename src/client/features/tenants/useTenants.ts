import {
  rooms as roomsApi,
  tenants as tenantsApi,
  type TenantInput,
  type TenantPatch,
} from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
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
    error: nguoiThue.error ?? phong.error,
    reload: nguoiThue.reload,
  };
}

export function useThaoTacNguoiThue(reload: () => void) {
  async function them(input: TenantInput): Promise<boolean> {
    try {
      await tenantsApi.create(input);
      baoThanhCong("Đã thêm người thuê.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function capNhat(id: number, patch: TenantPatch): Promise<boolean> {
    try {
      await tenantsApi.update(id, patch);
      baoThanhCong("Đã lưu người thuê.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  const chuyenDi = (id: number) => capNhat(id, { ngay_ra: homNay() });

  /** Undo a move-out recorded by mistake. Fails if the room is taken again. */
  const huyChuyenDi = (id: number) => capNhat(id, { ngay_ra: null });

  async function xoa(id: number): Promise<boolean> {
    try {
      await tenantsApi.remove(id);
      baoThanhCong("Đã xoá bản ghi người thuê.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { them, capNhat, chuyenDi, huyChuyenDi, xoa };
}
