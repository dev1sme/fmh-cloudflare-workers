import {
  buildings as buildingsApi,
  rooms as roomsApi,
  tenants as tenantsApi,
  type RoomInput,
} from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
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
    error: phong.error ?? nha.error,
    reload: phong.reload,
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
      baoThanhCong("Đã thêm phòng.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function capNhatPhong(id: number, patch: Partial<RoomInput>): Promise<boolean> {
    try {
      await roomsApi.update(id, patch);
      baoThanhCong("Đã lưu phòng.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  /** Rejected by the API while readings, invoices or tenants reference the room. */
  async function xoaPhong(id: number): Promise<boolean> {
    try {
      await roomsApi.remove(id);
      baoThanhCong("Đã xoá phòng.");
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
      baoThanhCong("Đã thêm người thuê.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function chuyenDi(tenantId: number): Promise<boolean> {
    try {
      await tenantsApi.update(tenantId, { moved_out: homNay() });
      baoThanhCong("Đã ghi nhận chuyển đi.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return { themPhong, capNhatPhong, xoaPhong, themNguoiThue, chuyenDi };
}
