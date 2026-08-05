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
  ho_ten: string;
  sdt: string;
  so_nguoi: number;
  ngay_vao: string;
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
        ho_ten: input.ho_ten,
        sdt: input.sdt || null,
        so_nguoi: input.so_nguoi,
        ngay_vao: input.ngay_vao,
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
      await tenantsApi.update(tenantId, { ngay_ra: homNay() });
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
