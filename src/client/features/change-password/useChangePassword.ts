import { useState } from "react";

import { auth } from "../../api";
import { baoThanhCong, thongBaoLoi } from "../../errors";
import i18n from "../../i18n";

/**
 * Self-service password change. Shows the error inline rather than as a toast:
 * "wrong current password" belongs next to the field the user is looking at.
 */
export function useChangePassword() {
  const [loi, setLoi] = useState<string | null>(null);
  const [dangChay, setDangChay] = useState(false);

  async function doiMatKhau(matKhauCu: string, matKhauMoi: string): Promise<boolean> {
    setDangChay(true);
    setLoi(null);

    try {
      await auth.doiMatKhau(matKhauCu, matKhauMoi);
      // `i18n.t`, not the hook: this is a plain function, not a component.
      baoThanhCong(i18n.t("changePassword.done"));
      return true;
    } catch (err) {
      setLoi(thongBaoLoi(err));
      return false;
    } finally {
      setDangChay(false);
    }
  }

  return { doiMatKhau, loi, dangChay };
}
