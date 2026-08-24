import {
  buildings as buildingsApi,
  rooms as roomsApi,
  tenants as tenantsApi,
  type RoomInput,
} from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import i18n from "../../i18n";
import { homNay } from "../../format";
import { useResource } from "../../hooks/useResource";

export function useDanhSachPhong() {
  const phong = useResource(() => roomsApi.list(), []);
  const nha = useResource(() => buildingsApi.list(), []);

  return {
    phong: phong.data?.rooms ?? [],
    // Needed to pick a building when adding a room.
    nha: nha.data?.buildings ?? [],
    loading: phong.loading || nha.loading,
    refreshing: phong.refreshing || nha.refreshing,
    error: phong.error ?? nha.error,
    // Both, not just the rooms. `error` surfaces whichever request failed, so a
    // retry that re-ran only one of them would leave the buildings error on
    // screen with a button that does nothing about it.
    reload: () => {
      phong.reload();
      nha.reload();
    },
  };
}

export type NguoiThueMoi = {
  full_name: string;
  phone: string;
  occupants: number;
  moved_in: string;
};

/**
 * Mutations for the rooms screen. Each returns whether it succeeded so the
 * caller can close its modal, and reports its own success/error toast.
 */
export function useThaoTacPhong(reload: () => void) {
  async function themPhong(input: RoomInput): Promise<boolean> {
    try {
      await roomsApi.create(input);
      baoThanhCong(i18n.t("rooms.added"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function capNhatPhong(code: string, patch: Partial<RoomInput>): Promise<boolean> {
    try {
      await roomsApi.update(code, patch);
      baoThanhCong(i18n.t("rooms.saved"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  /** Rejected by the API while readings, invoices or tenants reference the room. */
  async function xoaPhong(code: string): Promise<boolean> {
    try {
      await roomsApi.remove(code);
      baoThanhCong(i18n.t("rooms.deleted"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function themNguoiThue(roomId: number, input: NguoiThueMoi): Promise<boolean> {
    try {
      await tenantsApi.create({
        room_id: roomId,
        full_name: input.full_name,
        phone: input.phone || null,
        occupants: input.occupants,
        moved_in: input.moved_in,
      });
      baoThanhCong(i18n.t("tenantForm.added"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function chuyenDi(tenantCode: string): Promise<boolean> {
    try {
      await tenantsApi.update(tenantCode, { moved_out: homNay() });
      baoThanhCong(i18n.t("tenantForm.movedOutDone"));
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { themPhong, capNhatPhong, xoaPhong, themNguoiThue, chuyenDi };
}
