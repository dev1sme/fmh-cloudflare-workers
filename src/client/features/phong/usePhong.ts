import { rooms as roomsApi, tenants as tenantsApi, type RoomInput } from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import { homNay } from "../../format";
import { useResource } from "../../hooks/useResource";

export function useDanhSachPhong() {
  const { data, loading, error, reload } = useResource(() => roomsApi.list());
  return { phong: data?.rooms ?? [], loading, error, reload };
}

export type NguoiThueMoi = {
  ho_ten: string;
  sdt: string;
  ngay_vao: string;
};

/**
 * Mutations for the rooms screen. Each returns whether it succeeded so the
 * caller can close its modal, and reports its own success/error toast.
 */
export function useThaoTacPhong(reload: () => void) {
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

  async function themNguoiThue(roomId: number, input: NguoiThueMoi): Promise<boolean> {
    try {
      await tenantsApi.create({
        room_id: roomId,
        ho_ten: input.ho_ten,
        sdt: input.sdt || null,
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

  return { capNhatPhong, themNguoiThue, chuyenDi };
}
