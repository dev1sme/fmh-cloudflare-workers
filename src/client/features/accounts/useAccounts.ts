import { useState } from "react";

import {
  accounts as accountsApi,
  rooms as roomsApi,
  type AccountInput,
  type AccountWithPassword,
} from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import { useResource } from "../../hooks/useResource";

export function useDanhSachTaiKhoan() {
  const taiKhoan = useResource(() => accountsApi.list(), []);
  const phong = useResource(() => roomsApi.list(), []);

  return {
    taiKhoan: taiKhoan.data?.accounts ?? [],
    phong: phong.data?.rooms ?? [],
    loading: taiKhoan.loading || phong.loading,
    error: taiKhoan.error ?? phong.error,
    reload: taiKhoan.reload,
  };
}

/**
 * Mutations plus the one-shot password.
 *
 * `matKhauMoi` holds the plaintext the server just generated so the screen can
 * show it once; clearing it is the only place it exists. Nothing reads a
 * password back from the API.
 */
export function useThaoTacTaiKhoan(reload: () => void) {
  const [matKhauMoi, setMatKhauMoi] = useState<AccountWithPassword | null>(null);

  async function them(input: AccountInput): Promise<boolean> {
    try {
      setMatKhauMoi(await accountsApi.create(input));
      baoThanhCong("Đã tạo tài khoản.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function doiTen(id: number, username: string): Promise<boolean> {
    try {
      await accountsApi.rename(id, username);
      baoThanhCong("Đã đổi tên đăng nhập.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  /** No current password required — the manager is resetting someone else's. */
  async function datLaiMatKhau(id: number, password?: string): Promise<boolean> {
    try {
      setMatKhauMoi(await accountsApi.resetPassword(id, password));
      baoThanhCong("Đã đặt lại mật khẩu.");
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  async function xoa(id: number): Promise<boolean> {
    try {
      await accountsApi.remove(id);
      baoThanhCong("Đã xoá tài khoản.");
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return {
    them,
    doiTen,
    datLaiMatKhau,
    xoa,
    matKhauMoi,
    quenMatKhau: () => setMatKhauMoi(null),
  };
}
