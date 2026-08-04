import { useState } from "react";

import { auth, type SessionUser } from "../../api";
import { thongBaoLoi } from "../../errors";

/**
 * Login is the one place that shows the error inline instead of as a toast —
 * the message belongs next to the form the user is still looking at.
 */
export function useDangNhap(onLogin: (user: SessionUser) => void) {
  const [loi, setLoi] = useState<string | null>(null);
  const [dangChay, setDangChay] = useState(false);

  async function dangNhap(username: string, password: string) {
    setDangChay(true);
    setLoi(null);

    try {
      const { user } = await auth.login(username, password);
      onLogin(user);
    } catch (err) {
      setLoi(thongBaoLoi(err));
    } finally {
      setDangChay(false);
    }
  }

  return { dangNhap, loi, dangChay };
}
